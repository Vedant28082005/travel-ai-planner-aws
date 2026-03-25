You are an expert AWS Cloud Architect. I have a fully containerized microservice application called "Travel Planner," and I need you to guide me step-by-step through deploying it to AWS. I have limited AWS experience, so you must provide **foolproof, exact instructions** (including where to click in the AWS Console or the exact AWS CLI commands to run). Do not skip any steps.

### Context About My Project:
My project is hosted on GitHub at: `https://github.com/Vedant28082005/ai-travel-planner`
It is a Travel Planner consisting of a Next.js frontend and several FastAPI Python microservices. 

It has the following components:
1. **Frontend**: Next.js (Port 3000)
2. **Gateway**: FastAPI (Port 80)
3. **Auth Service**: FastAPI (Port 8001) -> Uses MongoDB cluster (MongoDB Atlas)
4. **AI Service**: FastAPI (Port 8002) -> Uses Google Gemini API
5. **Data Service**: FastAPI (Port 8003) -> Internal mocked data
6. **PDF Service**: FastAPI (Port 8005) -> Generates PDFs using ReportLab and uploads them to S3.
7. **Live Status Service**: FastAPI (Port 8006) -> Wrapped with `mangum` to run on AWS Lambda.

### Current Architecture & Setup:
- **Docker Ready**: Every service (including the frontend) has its own `Dockerfile`. 
- **Docker Compose**: There is a root `docker-compose.yml` that orchestrates the Gateway, Frontend, Auth, AI, Data, and PDF services.
- **S3 Integration**: The `pdf-service` is already hardcoded to use `boto3` to upload to S3 and generate a presigned URL.
- **Lambda Integration**: The `live-status-service` uses a specific Lambda Dockerfile (`FROM public.ecr.aws/lambda/python:3.10`) and executes via `main.handler`.

### Required Environment Variables:
The system requires the following `.env` file to function:
```env
MONGO_URI=<my-atlas-uri>
GEMINI_API_KEY=<my-gemini-key>
JWT_SECRET=<my-jwt-secret>
AWS_ACCESS_KEY_ID=<to-be-created>
AWS_SECRET_ACCESS_KEY=<to-be-created>
AWS_REGION=us-east-1
S3_BUCKET_NAME=<to-be-created>
```

### Your Mission:
Please guide me through setting up the following infrastructure one phase at a time (wait for my confirmation after each phase before continuing):

**Phase 1: IAM & S3 Setup**
- Walk me through creating an IAM User with the precise permissions needed for S3 (`PutObject`, `GetObject` for presigned URLs) and ECR/Lambda deployments.
- Walk me through creating the S3 Bucket and securing it (blocking public access, since I use presigned URLs).

**Phase 2: AWS Lambda & ECR (Live Status Service)**
- Give me the exact commands to authenticate my local Docker with Amazon ECR.
- Tell me how to build and push the `live-status-service` Docker image to ECR.
- Guide me through the AWS Console to create a Lambda function from that ECR container image.
- Guide me through attaching an API Gateway trigger to make the Lambda function publicly accessible via a URL.

**Phase 3: EC2 Docker Cluster (Main Application)**
- Guide me through creating an Ubuntu EC2 instance (e.g., t3.medium). Tell me exactly which Security Group ports to open (22, 80, 443, 3000, etc.).
- Give me the bash commands to SSH into the EC2 instance, install Git, Docker, and Docker Compose.
- Give me the commands to clone my GitHub repository, create the `.env` file, and run `docker-compose up --build -d`.

Start by acknowledging this prompt and providing the step-by-step instructions for **Phase 1**. Keep your instructions extremely clear and assume I am copying and pasting your terminal commands exactly.
