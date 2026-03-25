import os
from pymongo import MongoClient
from dotenv import load_dotenv

# 🔹 Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["travel_auth"]
users_collection = db["users"]