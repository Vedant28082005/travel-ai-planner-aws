from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Data Service Running 🚀"}


@app.get("/hotels")
def get_hotels(location: str):
    return [
        {"name": "Hotel A", "price": 2000},
        {"name": "Hotel B", "price": 3000},
        {"name": "Hotel C", "price": 4000},
    ]


@app.get("/flights")
def get_flights(origin: str, destination: str):
    return [
        {"airline": "Indigo", "price": 5000},
        {"airline": "Air India", "price": 6500},
    ]


@app.get("/trains")
def get_trains(origin: str, destination: str):
    return [
        {"train": "Rajdhani", "price": 2000},
        {"train": "Shatabdi", "price": 1800},
    ]