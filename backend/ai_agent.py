# ai_agent.py
import json
import re
import sqlite3
import ollama

DB_FILE = "infra.db"


# -------------------------
# DATABASE
# -------------------------
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_input TEXT,
            extracted TEXT,
            recommendation TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def save_request(user_input: str, extracted: dict, recommendation: str):
    """Save one record to SQLite."""
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO requests (user_input, extracted, recommendation) VALUES (?, ?, ?)",
        (user_input, json.dumps(extracted), recommendation),
    )
    conn.commit()
    conn.close()


# -------------------------
# JSON PARSING HELPERS
# -------------------------
def clean_json_block(s: str):
    """
    Try to extract a JSON object from a model response.
    - Removes fenced code blocks if present
    - Falls back to the first {...} block
    """
    s = s.strip()
    s = s.replace("```json", "```")
    if s.startswith("```") and s.endswith("```"):
        s = s.strip("`").strip()

    # Try direct JSON first
    try:
        return json.loads(s)
    except Exception:
        pass

    # Fallback: find first JSON object in the text
    m = re.search(r"\{.*\}", s, flags=re.S)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None


# -------------------------
# NON-STREAM: analyze + save + return JSON
# -------------------------
def analyze_infrastructure(sentence: str):
    """
    - Uses llama3:latest to return ONLY JSON with fields:
      { "extracted": {...}, "recommendation": "..." }
    - Saves to SQLite
    - Returns the parsed dict
    """
    system = (
        "You are a senior cloud infrastructure architect. "
        "Return ONLY valid JSON with keys 'extracted' and 'recommendation'. "
        "No markdown, no commentary. Be concise and realistic."
    )
    prompt = f"""
USER SENTENCE:
{sentence}

REQUIRED JSON SCHEMA:
{{
  "extracted": {{
    "num_servers": number | null,
    "num_databases": number | null,
    "load_balancer": boolean,
    "scalable": boolean
  }},
  "recommendation": "string"
}}
"""

    resp = ollama.chat(
        model="llama3:latest",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )

    content = resp["message"]["content"]
    data = clean_json_block(content)

    if not data:
        return {"error": "Failed to parse AI response", "raw": content}

    # Save to DB
    try:
        init_db()
        save_request(
            user_input=sentence,
            extracted=data.get("extracted", {}),
            recommendation=data.get("recommendation", ""),
        )
    except Exception as e:
        print("Database error:", e)

    return data


# -------------------------
# STREAM: yield tokens to the UI
# -------------------------
def stream_infrastructure(sentence: str):
    """
    Streams a natural-language recommendation (for the chat UI).
    If you need to stream JSON, consider streaming the recommendation first,
    then append the extracted JSON at the end.
    """
    system = (
        "You are a senior cloud/DevOps architect. "
        "Understand the user's infra needs, propose a practical architecture. "
        "Be concise; short paragraphs and bullets."
    )
    stream = ollama.chat(
        model="llama3:latest",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": sentence},
        ],
        stream=True,
    )

    # This generator yields token chunks (str) for SSE
    for chunk in stream:
        msg = chunk.get("message", {})
        token = msg.get("content")
        if token:
            yield token

