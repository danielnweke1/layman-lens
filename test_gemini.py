import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    api_key = api_key.strip().strip('"').strip("'")
print(f"Testing with key starting with: {api_key[:5]}...")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Say hello"
    )
    print("Success:", response.text)
except Exception as e:
    print("Error:", str(e))
