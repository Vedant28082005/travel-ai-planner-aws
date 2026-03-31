from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from fastapi import APIRouter
from bson import ObjectId

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


# --- 🛡️ ADMIN MIDDLEWARE ---
def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Decodes the JWT token specifically to check if the user has Admin rights.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        
        if role != "admin":
            raise HTTPException(status_code=403, detail="Access Denied: Admins Only")
            
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- ⚙️ ADMIN ROUTES ---

@app.get("/api/admin/users")
async def get_all_users(admin_payload=Depends(verify_admin)):
    """Fetch all users to display in the dashboard"""
    users = []
    # Find all users, but DO NOT return their hashed passwords for security
    cursor = users_collection.find({}, {"password": 0})
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        users.append(doc)
    return {"users": users}

@app.put("/api/admin/users/{user_id}/role")
async def update_user_role(user_id: str, payload: dict, admin_payload=Depends(verify_admin)):
    """Promote or Demote a user (guest, free, premium, admin)"""
    new_role = payload.get("role")
    if new_role not in ["guest", "free", "premium", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or role unchanged")
    return {"message": f"User upgraded to {new_role}"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, admin_payload=Depends(verify_admin)):
    """Remove a user entirely"""
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@app.get("/")
def root():
    return {"message": "Auth service running 🚀"}
