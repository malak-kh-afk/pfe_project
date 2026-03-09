import ollama
import json

def extract_infra(sentence: str):
    prompt = f"""
You are an infrastructure assistant.

Return ONLY valid JSON. No explanations, no extra text.

Extract infrastructure parameters from this sentence:

"{sentence}"
"""
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    content = response["message"]["content"].strip()

    # Check if content is empty
    if not content:
        return {"error": "empty response from model"}

    # Try parsing JSON, fallback if invalid
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"raw_output": content}

def full_workflow(sentence: str):
    """A wrapper for your full workflow"""
    infra = extract_infra(sentence)
    return infra
