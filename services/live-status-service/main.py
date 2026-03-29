from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: Users cloning this must update this IP to their own EC2 Public IP
EC2_BASE = "http://3.111.197.12"

@app.get("/status")
async def get_status():
    services = {
        "AI_Core": f"{EC2_BASE}:8002",
        "Data_Engine": f"{EC2_BASE}:8003",
        "Auth_System": f"{EC2_BASE}:8001"
    }
    
    health_results = {}
    async with httpx.AsyncClient() as client:
        for name, url in services.items():
            try:
                response = await client.get(url, timeout=1.5)
                health_results[name] = "Online" if response.status_code < 400 else "Issues"
            except:
                health_results[name] = "Offline"

    overall = "Operational" if all(v == "Online" for v in health_results.values()) else "Degraded"
    return {"status": overall, "details": health_results}

handler = Mangum(app)
