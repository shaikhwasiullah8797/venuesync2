import os
from google import genai
from google.genai import types

def test_func():
    return "Testing"

client = genai.Client()

prompt = "Hello"
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
)
print(response.text)
