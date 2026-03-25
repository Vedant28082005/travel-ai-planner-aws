from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

# Internal imports
from db import users_collection
from auth import (
    hash_password, 
    verify_password, 
    create_token, 
    SECRET_KEY, 
    ALGORITHM
)

app = FastAPI(title="Auth Service")
security = HTTPBearer()

# 🔥 CORS (Adjust origins for production later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Schemas
class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- 🔐 JWT VERIFICATION ENDPOINT (The "Source of Truth") ---

@app.get("/verify")
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Called by the BFF to verify if a user is who they say they are.
    This prevents frontend-side role spoofing.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify user still exists in DB (Optional but recommended)
        db_user = users_collection.find_one({"email": payload.get("email")})
        if not db_user:
            raise HTTPException(status_code=401, detail="User no longer exists")

        return {
            "valid": True,
            "email": db_user["email"],
            "role": db_user["role"] # Return the role currently in the DB
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- 📝 REGISTRATION & LOGIN ---

@app.post("/register")
def register(user: UserRegister):
    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = {
        "email": user.email,
        "password": hash_password(user.password),
        "role": "free",
        "created_at": datetime.utcnow()
    }
    users_collection.insert_one(new_user)
    return {"message": "User registered successfully"}

@app.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Generate token with the role stored in DB
    token = create_token({
        "email": db_user["email"],
        "role": db_user["role"]
    })

    return {
        "access_token": token,
        "role": db_user["role"]
    }

# --- 💎 UPGRADE LOGIC ---

@app.post("/upgrade-to-premium")
def upgrade_user(data: dict):
    email = data.get("email")
    result = users_collection.update_one(
        {"email": email},
        {"$set": {"role": "premium"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": f"User {email} upgraded to premium"}

@app.get("/")
def root():
    return {"message": "Auth service running 🚀"}