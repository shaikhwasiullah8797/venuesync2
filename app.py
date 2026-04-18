import os
import time
import json
import asyncio
import threading
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import google.generativeai as genai
from google.cloud import speech

load_dotenv()

# Configure Authentic Gemini SDK 
# Requires an active GOOGLE_API_KEY in the environment
if os.getenv("GOOGLE_API_KEY"):
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

app = FastAPI(title="VenueSync Ops Engine")

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

def simulate_stadium_crowd_engine():
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
        
        # Dump to JSON for any external monitoring hooks to consume (IoT paradigm)
        with open("live_crowd_data.json", "w") as f:
            json.dump(crowd_metrics, f)
            
        time.sleep(3)

# Start Autonomous Thread
threading.Thread(target=simulate_stadium_crowd_engine, daemon=True).start()

@app.get("/api/crowd_data")
def get_crowd_data():
    """Returns the live output of the backend simulator to the dashboard."""
    return JSONResponse(crowd_metrics)

# ========================================================
# HACKATHON FEATURE 2/5: NLP-DRIVEN EMERGENCY TRIAGE (STRUCTURED OUTPUTS)
# ========================================================
class SOSTriageRequest(BaseModel):
    message: str

@app.post("/api/sos_triage")
def process_sos(request: SOSTriageRequest):
    """Takes a natural language panic string and enforces strict Gemini 1.5 JSON Triage Schema."""
    if not os.getenv("GOOGLE_API_KEY"):
        return JSONResponse({"error": "No API Key active. Please add Google credentials."}, status_code=401)
        
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
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
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
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
    query: str

@app.post("/api/chat")
def playmaker_concierge_chat(request: ChatRequest):
    """Executes Gemini with function calling toolsets enabled."""
    if not os.getenv("GOOGLE_API_KEY"):
        return JSONResponse({"error": "No API Key active."}, status_code=401)
        
    try:
        # Pass the python function directly into the Gemini toolset
        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            tools=[get_live_stadium_wait_times],
            system_instruction="You are Playmaker Ops Assistant. You strictly assist the stadium commander. You have access to a live function to check wait times. Check it if asked about lines! You MUST respond directly in Hindi."
        )
        
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(request.query)
        
        return JSONResponse({"response": response.text})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ========================================================
# FRONTEND HOSTING
# ========================================================
# Mount the HTML/JS frontend over the root path
app.mount("/", StaticFiles(directory="d:/AntiGravity", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Serves the full stack application on Port 8001 to avoid 'Socket in Use' errors
    uvicorn.run(app, host="0.0.0.0", port=8001)
