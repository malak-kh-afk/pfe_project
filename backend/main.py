# main.py
import json
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from intent import detect_intent

# auth
from auth import router as auth_router, init_auth

app = FastAPI()

# Initialize users table
@app.on_event("startup")
def startup():
    init_auth()

# mount /auth routes
app.include_router(auth_router)


# ---------------------------------------------------
# MODEL CONFIG
# ---------------------------------------------------

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "llama3:latest"


# ---------------------------------------------------
# SYSTEM PROMPT
# ---------------------------------------------------
SYSTEM = """
You are a senior Cloud & DevOps Architect.

GENERAL RULES
- Always reply in clean, well‑structured Markdown.
- If the user greets you, respond politely.
- If the user describes infrastructure needs, provide a clear architecture explanation.
- BEFORE generating Terraform or YAML, ALWAYS ask the user to confirm the environment:
  Cloud (AWS/Azure/GCP), Virtual Machines, Kubernetes/OpenShift, or Hybrid.
- NEVER generate Terraform until the environment is confirmed.
- Keep answers short, clear, and actionable.

CRITICAL MARKDOWN RULES (STRICT)
- Every heading MUST be on its own line.
- Always insert ONE blank line *after* each heading.
- Always insert ONE blank line *between* sections.
- List items must start on their own line.
- NEVER glue headings to text  (avoid patterns like “##Architecture” or “###Load BalancerA”).
- Never stream partial Markdown markers. Always complete “## Heading” and “```” blocks.
- NEVER EVER OUTOUT HTML (no <br/>, <b>, <i>, <p>, <div>). Use pure Markdown only.
"""
FORMAT ="""DEFAULT RESPONSE STRUCTURE (ADAPT to context)

## Summary

- 3–5 bullets explaining the user’s goal and constraints

## Architecture

- Components
- Data flow
- Scaling & HA
- Networking & security
- Operational concerns

## Next Step

- Ask the user the next required decision (typically confirm environment)

"""
# ---------------------------------------------------
# STREAM LLM RESPONSE
# ---------------------------------------------------

import re

# ---- HTML → Markdown (outside code fences) ----
def _normalize_htmlish(text: str) -> str:
    parts = re.split(r"(```.*?```)", text, flags=re.S)
    out = []
    for chunk in parts:
        if chunk.startswith("```"):
            out.append(chunk)
            continue

        s = chunk
        # line/paragraph breaks
        s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
        s = re.sub(r"</p\s*>", "\n\n", s, flags=re.I)
        s = re.sub(r"<p\s*>", "", s, flags=re.I)
        s = re.sub(r"</div\s*>", "\n", s, flags=re.I)
        s = re.sub(r"<div\s*>", "", s, flags=re.I)
        s = re.sub(r"&nbsp;", " ", s, flags=re.I)

        # inline tags → Markdown
        s = re.sub(r"</?(strong|b)\s*>", "**", s, flags=re.I)
        s = re.sub(r"</?(em|i)\s*>", "*", s, flags=re.I)

        # list HTML → Markdown (best‑effort)
        s = re.sub(r"</?ul\s*>", "\n", s, flags=re.I)
        s = re.sub(r"</?ol\s*>", "\n", s, flags=re.I)
        s = re.sub(r"<li\s*>", "- ", s, flags=re.I)
        s = re.sub(r"</li\s*>", "\n", s, flags=re.I)

        # drop any remaining tag
        s = re.sub(r"<[^>]+>", "", s)
        out.append(s)
    return "".join(out)

# ---- Headings & lists normalization (outside code fences) ----

_HEADING_LINE = re.compile(r"^#{1,6}\s+[^\n]+", re.MULTILINE)

def _fix_markdown(text: str) -> str:
    parts = re.split(r"(```.*?```)", text, flags=re.S)
    out = []

    for chunk in parts:
        if chunk.startswith("```"):
            out.append(chunk)
            continue

        s = chunk

        # Ensure space after hashes: "##Heading" → "## Heading"
        s = re.sub(r"(^|\n)(#{1,6})([^\s#])", r"\1\2 \3", s)

        # Promote section labels ONLY if they start a line
        s = re.sub(r"(?<!#)(^|\n)\s*Summary\b:?\s*", r"\n\n## Summary\n\n", s)
        s = re.sub(r"(?<!#)(^|\n)\s*Architecture\b:?\s*", r"\n\n## Architecture\n\n", s)
        s = re.sub(r"(?<!#)(^|\n)\s*Next Step(s)?\b:?\s*", r"\n\n## Next Steps\n\n", s)

        # Ensure blank line BEFORE headings
        s = re.sub(r"([^\n])\n(#{1,6}\s+[^\n]+)", r"\1\n\n\2", s)

        # Ensure blank line AFTER headings
        def _after_heading(m):
            return m.group(0) + "\n\n"

        s = _HEADING_LINE.sub(_after_heading, s)

        # Lists: each bullet on new line
        s = re.sub(r"(?<!\n)[ \t]*([-*]\s+)", r"\n\1", s)

        # Ensure blank line before first bullet block
        s = re.sub(r"([^\n])\n([-*]\s+)", r"\1\n\n\2", s)

        # Clean formatting
        s = re.sub(r"\n{3,}", "\n\n", s)   # max 2 newlines
        s = re.sub(r"\n#\n", "\n", s)      # remove stray #

        out.append(s.strip())

    return "\n".join(out)

async def stream_llm(prompt: str):
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            # If you also use a second system message with format rules, include it here:            {"role": "system", "content": FORMAT},
            {"role": "user",   "content": prompt},
        ],
        "stream": True,
        "options": {
            "temperature": 0.5,
            "top_p": 0.9,
            "num_ctx": 2048,
        },
    }

    buf = ""

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", OLLAMA_URL, json=payload) as r:
            async for line in r.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                except Exception:
                    continue

                chunk = data.get("message", {}).get("content")
                done  = data.get("done", False)
                if chunk:
                    buf += chunk
                    # flush on double newline or sentence end; keeps "## Heading" together
                    if "\n\n" in chunk or re.search(r"[.!?]\s$", chunk):
                        out = _normalize_htmlish(buf)
                        out = _fix_markdown(buf)
                        yield f"data: {out}\n\n"
                        buf = ""

                if done:
                    if buf.strip():
                        out=_normalize_htmlish(buf)
                        out=_fix_markdown(out)
                        yield f"data: {out}\n\n"
                        buf = ""
                    yield "event: done\ndata: {}\n\n"
                    return


#---------------------------------------------------
# CHAT ROUTE
# ---------------------------------------------------

@app.post("/chat/stream")
async def chat_stream(req: Request):
    body = await req.json()
    prompt = body.get("prompt", "")

    intent = detect_intent(prompt)

    # simple greeting handling
    if intent == "greeting":
        async def greet():
            msg = "Hello 👋 How can I help you design your infrastructure today?"
            yield f"data: {msg}\n\n"
            yield "event: done\ndata: {}\n\n"
        return StreamingResponse(greet(), media_type="text/event-stream")

    return StreamingResponse(
        stream_llm(prompt),
        media_type="text/event-stream"
    )
