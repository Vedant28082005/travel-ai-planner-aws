import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")

client = genai.Client(api_key=api_key)

try:
    print("\n--- AVAILABLE MODELS ---")
    # In the new SDK, we just list and print the names
    for model in client.models.list():
        print(f"✅ {model.name}")
except Exception as e:
    print(f"❌ Failed to list models: {e}")