# travel-ai-planner-aws


# 🌍 YatraAI: Hybrid Cloud AI Travel Orchestrator

**YatraAI** is a high-performance, microservices-based travel planning platform. It leverages **Generative AI** and a **Hybrid Cloud Architecture** to provide seamless trip orchestration while maintaining a minimal resource footprint on cloud infrastructure.

## 🏗️ System Architecture

Unlike traditional monolithic applications, YatraAI is built using a **Decoupled Microservices** approach, optimized for the AWS ecosystem:

  * **Compute Tier (AWS EC2):** Hosts the Next.js frontend and core Python microservices (Auth, AI, Data, PDF) inside Docker containers.
  * **Serverless Tier (AWS Lambda):** Executes an independent **Live Status Service**. This "outside-in" monitoring approach reclaims **\~20% of EC2 RAM** by offloading health-check overhead to serverless functions.
  * **Orchestration:** Managed via **Docker Compose** for consistent deployment across development and production environments.
  * **AI Layer:** Integrated with **Google Gemini Pro** for intelligent, context-aware itinerary generation.

-----

## 🚀 Key Features

  * **Agentic AI Planning:** Generates day-wise itineraries, budget breakdowns, and hotel/transport suggestions using LLMs.
  * **Live System Heartbeat:** A real-time status badge powered by **AWS Lambda** that confirms system availability before user interaction.
  * **Role-Based Access:** Managed JWT authentication for Guest, Free, and Premium user tiers.
  * **Logistics Integration:** Dynamic data fetching for hotels and flights (Premium feature).
  * **Resource Optimized:** Architected specifically to run heavy AI workloads on limited **t3.micro** hardware.

-----

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| **Backend** | Python 3.10, FastAPI, Mangum |
| **Database** | MongoDB (Atlas) |
| **Infrastructure** | AWS (EC2, Lambda, ECR, CloudWatch) |
| **DevOps** | Docker, Docker Compose, Git |
| **AI Model** | Google Gemini 1.5 Pro |

-----

## 📂 Project Structure

```text
├── frontend/               # Next.js Web Interface
├── gateway/                # Nginx/API Gateway configuration
├── services/
│   ├── auth-service/       # JWT Authentication & User Logic
│   ├── ai-service/         # Gemini API Integration & Prompt Engineering
│   ├── data-service/       # MongoDB Persistence Layer
│   ├── pdf-service/        # Report Generation Logic
│   └── live-status/        # Serverless Python code (Deployed to Lambda)
├── docker-compose.yml      # Multi-container Orchestration
└── .env.example            # Template for environment variables
```

-----

## ⚙️ Installation & Setup

### 1\. Prerequisites

  * Docker & Docker Compose installed
  * AWS CLI configured with IAM permissions
  * Google Gemini API Key

### 2\. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Gemini API
GEMINI_API_KEY=your_key_here

# AWS Lambda Config
NEXT_PUBLIC_LIVE_STATUS_URL=https://your-lambda-url.aws/status

# Database
MONGODB_URI=your_mongodb_atlas_uri
```

### 3\. Launch the Stack

```bash
docker compose up -d --build
```

Access the application at `http://localhost:3000` (Local) or your **EC2 Public IP**.

-----

## 🛡️ Security Note

This repository uses a `.gitignore` to prevent sensitive credentials (`.env`) from being exposed. Always use the provided `.env.example` template for new deployments.

-----

**Developed by [Vedant28082005](https://www.google.com/search?q=https://github.com/Vedant28082005)**
*Building the future of AI-driven travel.*

-----

This is a critical section for your `README.md`. If someone clones your repo, their biggest hurdle will be the **Lambda-to-EC2 handshake**. 

By documenting this, you show your instructor that you understand **Infrastructure as Code (IaC)** concepts—meaning you know how to tell others to rebuild your cloud environment from scratch.

---

### ☁️ AWS Lambda Status Setup Guide

To get the **Live Status Badge** working on a new AWS account, follow these steps to deploy the serverless component and link it to your EC2 instance.

#### 1. Prepare the Container Image (ECR)
The Lambda runs as a Docker container. You must first push the image to **Amazon ECR**:
1.  Create an ECR repository named `live-status-service`.
2.  Authenticate your Docker CLI:
    ```bash
    aws ecr get-login-password --region <YOUR_REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<YOUR_REGION>.amazonaws.com
    ```
3.  Build and Push the image:
    ```bash
    docker build -t live-status-service ./services/live-status-service
    docker tag live-status-service:latest <ACCOUNT_ID>.dkr.ecr.<YOUR_REGION>.amazonaws.com/live-status-service:latest
    docker push <ACCOUNT_ID>.dkr.ecr.<YOUR_REGION>.amazonaws.com/live-status-service:latest
    ```

#### 2. Create the Lambda Function
1.  In the AWS Console, create a new function: **"Create from Container Image."**
2.  Select the image you just pushed to ECR.
3.  **Critical: Architecture:** Ensure the architecture matches your build (likely `x86_64` for EC2/Standard builds).
4.  **Function URL:** Go to **Configuration > Function URL** and create a URL with **Auth type: NONE**.

#### 3. Fix the CORS Policy
Browsers will block the status badge if CORS isn't configured. Run this command to allow your EC2 IP to fetch the status:
```bash
aws lambda update-function-url-config \
    --function-name live-status-lambda \
    --cors '{
        "AllowOrigins": ["*"],
        "AllowMethods": ["*"],
        "AllowHeaders": ["*"],
        "MaxAge": 3600
    }'
```

#### 4. Update Frontend Environment
The Next.js frontend "bakes" the Lambda URL into the code during the build process.
1.  Open your `.env` file on the EC2 instance.
2.  Add the URL (ensure it ends with `/status`):
    ```text
    NEXT_PUBLIC_LIVE_STATUS_URL=https://<YOUR_UNIQUE_ID>.lambda-url.<REGION>.on.aws/status
    ```
3.  **Force Rebuild:** You must rebuild the frontend container for the changes to take effect:
    ```bash
    docker compose build --no-cache frontend
    docker compose up -d frontend
    ```

#### 5. EC2 Security Groups (Optional for Advanced Pinging)
If you upgrade the Lambda to ping internal microservices:
* Go to **EC2 > Security Groups**.
* Add **Inbound Rules** for ports `8001, 8002, 8003` to allow traffic from the Lambda's IP range (or `0.0.0.0/0` for testing).

---

### 💡 Why this setup?
This architecture uses **Independent Lifecycle Management**. The frontend and core services live on the EC2 for persistence, while the status monitor is **Serverless**. This ensures that even if the EC2 hits a "Memory Out" error, the Status Badge remains operational to provide system feedback to the user.

---


