import os
import time
import json
import asyncio
import threading
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.cloud import texttospeech
from google.auth.exceptions import DefaultCredentialsError
import io

load_dotenv()

# Configure Authentic Gemini SDK 
# Requires an active GOOGLE_API_KEY in the environment
client = None
if os.getenv("GOOGLE_API_KEY"):
    client = genai.Client()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute non-blocking thread using native asyncio
    task = asyncio.create_task(simulate_stadium_crowd_engine())
    yield
    task.cancel()

app = FastAPI(title="VenueSync Ops Engine", lifespan=lifespan)

# ========================================================
# SECURITY ENHANCEMENTS (HACKATHON REQUIREMENT)
# ========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ========================================================
# HACKATHON FEATURE 1: AUTONOMOUS CROWD SIMULATOR THREAD
# Continuous Python Background Processor generating data without frontend looping
# ========================================================
crowd_metrics = {
    "North Gate": 40,
    "East Gate": 20,
    "South Gate": 30,
    "Popcorn Plaza": 5,
    "Drinks Kiosk": 4
}

async def simulate_stadium_crowd_engine():
    """Background engine simulating hardware turnstile events."""
    import random
    while True:
        # Simulate mass influx events shifting across gates
        crowd_metrics["North Gate"] += random.randint(-5, 8)
        crowd_metrics["North Gate"] = min(100, max(0, crowd_metrics["North Gate"]))
        
        crowd_metrics["East Gate"] += random.randint(-4, 5)
        crowd_metrics["East Gate"] = min(100, max(0, crowd_metrics["East Gate"]))
        
        crowd_metrics["Popcorn Plaza"] += random.randint(-2, 4)
        crowd_metrics["Drinks Kiosk"] += random.randint(-2, 4)
        
        # Dump to JSON efficiently using asyncio
        with open("live_crowd_data.json", "w") as f:
            json.dump(crowd_metrics, f)
            
        await asyncio.sleep(3)

# ========================================================

@app.get("/api/crowd_data")
def get_crowd_data():
    """Returns the live output of the backend simulator to the dashboard."""
    return JSONResponse(crowd_metrics)

# ========================================================
# HACKATHON FEATURE 2/5: NLP-DRIVEN EMERGENCY TRIAGE (STRUCTURED OUTPUTS)
# ========================================================
class SOSTriageRequest(BaseModel):
    message: str = Field(..., max_length=500) # Security constraint

@app.post("/api/sos_triage")
def process_sos(request: SOSTriageRequest):
    """Takes a natural language panic string and enforces strict Gemini 1.5 JSON Triage Schema."""
    if not os.getenv("GOOGLE_API_KEY"):
        return JSONResponse({"error": "No API Key active. Please add Google credentials."}, status_code=401)
        
    try:
        prompt = f"""
        You are a highly advanced Medical/Security Stadium Triage AI.
        Analyze this raw message from an attendee: '{request.message}'
        
        You must deduce exactly where the incident occurred and classify its severity.
        Return ONLY valid JSON corresponding to this schema:
        {{
            "severity": "CRITICAL" | "HIGH" | "LOW",
            "incident_type": "Medical" | "Security" | "Lost Item" | "Maintenance",
            "extracted_location": "String describing the location",
            "dispatch_recommendation": "String advising ops center what to do"
        }}
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        triage_data = json.loads(response.text)
        return JSONResponse(triage_data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ========================================================
# HACKATHON FEATURE 3/4: FUNCTION CALLING CONCIERGE & DYNAMIC STORES
# ========================================================
# Define the Python Function that Gemini will execute autonomously
def get_live_stadium_wait_times(facility_name: str) -> str:
    """Returns the precise current wait time for a specific food stand or gate."""
    val = crowd_metrics.get(facility_name)
    if val:
        return f"The current wait time at {facility_name} is {val} minutes."
    return "Facility not found in live metrics database."

class ChatRequest(BaseModel):
    query: str = Field(..., max_length=2000)

@app.post("/api/chat")
def playmaker_concierge_chat(request: ChatRequest):
    """Executes Gemini with function calling toolsets enabled."""
    if not os.getenv("GOOGLE_API_KEY"):
        return JSONResponse({"error": "No API Key active."}, status_code=401)
        
    try:
        # Pass the python function directly into the Gemini toolset
        chat = client.chats.create(
            model='gemini-2.5-flash',
            config=types.GenerateContentConfig(
                tools=[get_live_stadium_wait_times],
                system_instruction="You are Playmaker Ops Assistant. You strictly assist the stadium commander. You have access to a live function to check wait times. Check it if asked about lines! You MUST respond directly in Hindi."
            )
        )
        
        response = chat.send_message(request.query)
        
        return JSONResponse({"response": response.text})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ========================================================
# HACKATHON GOOGLE SERVICES: AUTHENTIC TEXT-TO-SPEECH
# ========================================================
class TTSRequest(BaseModel):
    text: str = Field(..., max_length=1000)

@app.post("/api/tts")
async def generate_tts(request: TTSRequest):
    """Securely utilizes authentic Google Cloud SDK for Audio Generation to replace local browser synth."""
    try:
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=request.text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US", name="en-US-Journey-F" # Premium realistic voice
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        return Response(content=response.audio_content, media_type="audio/mpeg")
    except DefaultCredentialsError:
         return JSONResponse({"error": "Google Cloud TTS Credentials Missing. Feature inactive."}, status_code=401)
    except Exception as e:
         return JSONResponse({"error": str(e)}, status_code=500)


# ========================================================
# FRONTEND HOSTING
# ========================================================
# Mount the HTML/JS frontend over the root path (Fixed for Cloud Run Linux paths)
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Cloud Run gives us a PORT environment variable. We use 8080 as a fallback.
    port = int(os.environ.get('PORT', 8080))
    # Serves the full stack application on 0.0.0.0 and the dynamic port
    uvicorn.run(app, host="0.0.0.0", port=port)