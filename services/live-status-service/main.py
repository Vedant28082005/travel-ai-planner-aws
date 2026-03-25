from fastapi import FastAPI
from mangum import Mangum

app = FastAPI(title="Live Status Service")

@app.get("/status")
def get_status():
    return {"status": "Operational"}

# Wrap the FastAPI app for AWS Lambda compatibility
handler = Mangum(app)
