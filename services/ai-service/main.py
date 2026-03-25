import os
import json
import time
from datetime import datetime, timezone
from typing import List, Dict, Any  # Added Any here

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv

from db import plans_collection
from google import genai
from google.genai import types
from google.api_core import exceptions

load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

app = FastAPI(title="AI Travel Orchestrator")

# Confirmed model ID from your diagnostic script
MODEL_ID = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- 1. SCHEMAS ---

class TravelRequest(BaseModel):
    origin: str
    destination: str
    days: int
    user_type: str

class ItineraryDay(BaseModel):
    day: int
    plan: str

class GeminiResponse(BaseModel):
    # Fixed: Changed 'any' to 'Any'
    budget: Dict[str, Any] 
    itinerary: List[ItineraryDay]
    top_places: List[Dict[str, str]]
    hotels: List[Dict[str, Any]]
    flights: List[Dict[str, Any]]
    trains: List[Dict[str, Any]]
    recommendations: List[str]

# --- 2. AI LOGIC ---

def generate_with_gemini(data: dict):
    print(f"📡 Requesting high-detail plan for {data['days']} days in {data['destination']}...")

    prompt = f"""
    Return ONLY VALID JSON.
    You are a luxury travel consultant. Generate a HIGH-DETAIL {data['days']}-day travel plan from {data['origin']} to {data['destination']}.
    
    STRICT JSON SCHEMA:
    {{
      "budget": {{ "total": 0, "breakdown": {{ "stay": 0, "travel": 0, "food": 0 }} }},
      "itinerary": [ {{ "day": 1, "plan": "Detailed hour-by-hour breakdown (Morning: ..., Afternoon: ..., Evening: ...). Include specific names of cafes, streets, or viewpoints." }} ],
      "top_places": [ {{ "name": "text", "description": "vivid description" }} ],
      "hotels": [ {{ "name": "Real Hotel Name", "price_per_night": 0, "rating": 5.0, "location": "Area Name" }} ],
      "flights": [ {{ "airline": "Airline Name", "price": 0, "departure": "HH:MM AM/PM", "duration": "XH XM" }} ],
      "trains": [ {{ "train_name": "Train Name/Number", "price": 0, "departure": "HH:MM AM/PM", "duration": "XH XM" }} ],
      "recommendations": ["pro-tip 1", "pro-tip 2"]
    }}
    
    RULES:
    - ITINERARY: Write at least 60-80 words per day. Be descriptive and creative.
    - LOGISTICS: Provide EXACTLY 5 diverse options for hotels, 5 for flights, and 5 for trains. 
    - DATA: Use realistic Indian names and current market prices in INR (₹).
    """

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )

            raw_text = response.text.strip()
            
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            
            parsed_json = json.loads(raw_text)
            
            # Validation Step
            return GeminiResponse(**parsed_json).model_dump()

        except exceptions.ResourceExhausted:
            wait = (attempt + 1) * 10
            print(f"⚠️ Quota hit. Retrying in {wait}s...")
            time.sleep(wait)

        except (ValidationError, json.JSONDecodeError) as e:
            print(f"❌ Validation Failed (Attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1: raise e
            time.sleep(2)

        except Exception as e:
            print(f"❌ Error: {e}")
            if attempt == max_retries - 1: raise e
            time.sleep(2)

    raise HTTPException(status_code=500, detail="Failed to generate plan.")

# --- 3. ROUTES ---

@app.post("/generate")
def generate_plan(req: TravelRequest):
    try:
        ai_result = generate_with_gemini(req.model_dump())

        full_response = {
            "origin": req.origin,
            "destination": req.destination,
            "days": req.days,
            "user_type": req.user_type,
            **ai_result,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        inserted = plans_collection.insert_one(full_response)
        full_response["_id"] = str(inserted.inserted_id)

        print(f"✅ Detailed Plan Generated: {full_response['_id']}")
        return full_response

    except Exception as e:
        print(f"❌ SERVER ERROR: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))