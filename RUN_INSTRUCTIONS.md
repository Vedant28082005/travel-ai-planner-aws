# How to Run Travel Planner Locally

To start the Travel Planner application locally, you need to start the microservices and the frontend. 

Since you are using a Python virtual environment (`venv`) located in the root directory, you **must use the python executable from the venv** for the backend services.

Open a separate terminal window for each of the following commands:

### 1. Auth Service (Port 8001)
Navigate to the `auth-service` folder and start it with reload enabled:
```powershell
cd C:\Desktop\travel-planner\services\auth-service
C:\Desktop\travel-planner\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

### 2. AI Service (Port 8002)
Navigate to the `ai-service` folder and start it with reload enabled:
```powershell
cd C:\Desktop\travel-planner\services\ai-service
C:\Desktop\travel-planner\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8002
```

### 3. Data Service (Port 8003)
Navigate to the `data-service` folder and start it **without** reload (to prevent background crashing):
```powershell
cd C:\Desktop\travel-planner\services\data-service
C:\Desktop\travel-planner\venv\Scripts\python.exe -m uvicorn main:app --port 8003
```

### 4. PDF Service (Port 8005)
Navigate to the `pdf-service` folder and start it **without** reload (to prevent background crashing):
```powershell
cd C:\Desktop\travel-planner\services\pdf-service
C:\Desktop\travel-planner\venv\Scripts\python.exe -m uvicorn main:app --port 8005
```

### 5. Frontend App (Port 3000)
Navigate to the `frontend` folder and run the Next.js development server:
```powershell
cd C:\Desktop\travel-planner\frontend
npm run dev
```

---

### Accessing the App
Once everything represents as started in your terminals, you can access the frontend in your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

### Troubleshooting Notes
* If any python service says `errno: -4078` or `ECONNREFUSED` on frontend fetch, it means the API service terminal crashed. Ensure you are running `data-service` and `pdf-service` *without* `--reload` as shown above.
* **Stop all services:** Press `CTRL + C` in each terminal window.

---

# Docker Orchestration (The "Big Bang")
If you have Docker Desktop installed, you can skip starting everything manually and spin up the entire cluster at once using the `docker-compose.yml` file provided at the root:

```powershell
docker-compose up --build -d
```
All containers will map to the exact same ports, allowing your local frontend (or the dockerized frontend on port 3000) to communicate identically.

# AWS Cloud Deployment
The project is now equipped to seamlessly scale into AWS:

### 1. S3 for PDFs
The `pdf-service` has been fully rewritten to use `boto3`. Make sure the following environment variables are present in your `.env` (or via AWS ECS secrets) when deploying:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`

The `POST /generate-pdf` route will now stream the bytebuffer to your bucket and instantly return a pre-signed URL to the client.

### 2. Lambda for Live-Status-Service
The `live-status-service` `main.py` has been wired up with `fastapi` and ported through `mangum`. We also built a special Lambda-optimized `Dockerfile` for it (`public.ecr.aws/lambda/python:3.10`), ready to be pushed to Amazon ECR and run Serverless!
