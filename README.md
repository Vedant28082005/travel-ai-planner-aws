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

**Would you like me to help you create a "Development Wiki" page for your repo that explains the internal API documentation for each microservice?**
