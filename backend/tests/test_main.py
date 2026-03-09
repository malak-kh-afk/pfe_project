import asyncio
from main import stream_llm

async def test_stream():
    prompt = "Explain how to scale a web application database for more users."
    async for chunk in stream_llm(prompt):
        print(chunk)  # see raw streamed chunks

asyncio.run(test_stream())
