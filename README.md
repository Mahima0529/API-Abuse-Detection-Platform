<h1 align="center">🛡️ API Abuse Detection Platform</h1>

<p align="center">
  A microservices-based security platform to detect API abuse,
  suspicious behavior, rate-limit violations, and malicious traffic in real time.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
  <img src="https://img.shields.io/badge/Apache%20Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
</p>

---

## ✨ Overview

**API Abuse Detection Platform** is a microservices-based security platform that continuously monitors API traffic and detects suspicious or abusive behavior.

It tracks API requests, applies Redis-based rate limiting, calculates behavioral risk scores, detects abnormal request patterns, temporarily blocks high-risk entities, and streams security events through Apache Kafka.

The platform also provides a real-time security dashboard for monitoring request throughput, rate-limit violations, suspicious activity, blocked IP addresses, failed logins, and security audit events.

---

## 📸 Dashboard Preview

A real-time API security dashboard for monitoring API traffic and abuse detection.

<!-- Add your dashboard screenshot here -->

<p align="center">
  <img src="YOUR_SCREENSHOT_URL" alt="API Abuse Detection Dashboard">
</p>

---

## 🚀 Features

| | |
|---|---|
| 🧩 **Microservices Architecture** | API Gateway, authentication, rate limiting, abuse detection, analytics, and alert services |
| 🔐 **JWT Authentication** | Secure user registration and login with protected routes |
| 🚦 **Redis Rate Limiting** | Controls excessive API requests and detects rate-limit violations |
| 🧠 **Behavioral Risk Scoring** | Assigns risk scores based on suspicious API activity |
| 🚫 **Automatic IP Blocking** | Temporarily blocks high-risk IP addresses using Redis |
| 📡 **Kafka Event Streaming** | Publishes security and telemetry events asynchronously |
| 📊 **Real-Time Analytics** | Tracks API requests, RPM, suspicious requests, and security events |
| ⚠️ **Security Audit Trail** | Records blocked entities and suspicious security activity |
| 🧪 **Attack Simulator** | Generates multi-signal attack traffic to test the protection system |
| 🐳 **Fully Dockerized** | Runs the complete platform using Docker Compose |

---

## 🏗️ Architecture

```text
                         ┌───────────────────────┐
                         │       Frontend        │
                         │    React Dashboard    │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      API Gateway      │
                         │       Port 8080        │
                         └───────────┬───────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │     Auth     │   │     Risk     │   │   Analytics  │
          │   Service    │   │   Engine     │   │    Service   │
          └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Backend Cluster   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │  Redis   │    │  Kafka   │    │  Prisma  │
              │Rate Limit│    │  Events  │    │ SQL DB   │
              │ Blocking │    │ Streaming│    │          │
              └──────────┘    └──────────┘    └──────────┘

## 🛠️ Tech Stack

| Layer | Stack |
|---|---|
| 🎨 Frontend | React · Vite · Tailwind CSS |
| ⚙️ Backend | Node.js · Express.js |
| 🚪 API Gateway | Express.js |
| 🔐 Authentication | JWT |
| 🗄️ Database | Prisma · SQL |
| ⚡ Caching / Rate Limiting | Redis |
| 📨 Event Streaming | Apache Kafka |
| 🧭 Kafka Coordination | Zookeeper |
| 🐳 Infrastructure | Docker · Docker Compose |

---

## ⚙️ Getting Started

Follow the steps below to run the project locally.

### ✅ Prerequisites

Before running the project, make sure the following are installed:

- 🐳 Docker
- 🐳 Docker Compose
- 🟢 Node.js
- 🐙 Git
- 💻 A modern web browser

### 📥 Installation

**1. Clone the repository**
```bash
git clone https://github.com/Mahima0529/API-Abuse-Detection-Platform.git
cd API-Abuse-Detection-Platform
```

**2. Configure environment variables**
```bash
cp backend/.env.example backend/.env
```

**3. Start all services**
```bash
docker compose up --build
```

To run the services in the background:
```bash
docker compose up --build -d
```

**4. Check running containers**
```bash
docker ps
```

### 🌐 Application URLs

| Service | URL |
|---|---|
| 🖥️ Frontend | http://localhost:5173 |
| 🚪 API Gateway | http://localhost:8080 |
| 💓 API Gateway Health | http://localhost:8080/health |
| 💓 Backend Health | http://localhost:8080/api/v1/health |

### 🔑 Environment Variables

Create the environment file:
```bash
cp backend/.env.example backend/.env
```

Example configuration:
```env
NODE_ENV=production
PORT=5000

DATABASE_URL=file:./dev.db

JWT_SECRET=your_jwt_secret

REDIS_HOST=redis
REDIS_PORT=6379

KAFKA_BROKER=kafka:9092

RATE_LIMIT_GENERAL_LIMIT=100
RATE_LIMIT_LOGIN_LIMIT=10
RATE_LIMIT_REGISTRATION_LIMIT=5

TEMP_BLOCK_TTL_SEC=300
```

> ⚠️ **Never** commit real passwords, JWT secrets, API keys, or other sensitive credentials to GitHub. Use `.env.example` to document required configuration.

---

## 📡 API Reference

### 💓 Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | API Gateway health check |
| GET | `/api/v1/health` | Backend health check |

### 🔐 Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and receive authentication credentials |

### 👤 Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/users` | User-related operations |

### 📊 Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/analytics` | Access analytics information |

### 🚪 Gateway Routes

| Route | Service |
|---|---|
| `/api/v1/auth` | Authentication |
| `/api/v1/users` | User Management |
| `/api/v1/risk` | Risk Detection |
| `/api/v1/analytics` | Analytics |
| `/api/v1/alerts` | Alerts |

**Example — Registration Request**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123"
}
```

**Example — Login Request**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
```

---

## 🗺️ Roadmap

- [ ] Advanced anomaly detection
- [ ] Machine-learning-based risk scoring
- [ ] IP reputation integration
- [ ] Advanced bot detection
- [ ] Email security alerts
- [ ] Slack alert integration
- [ ] Discord alert integration
- [ ] Geographic attack visualization
- [ ] Role-based access control
- [ ] Security report generation
- [ ] Advanced analytics
- [ ] Cloud deployment
- [ ] Kubernetes deployment
- [ ] Distributed service scaling

---

## 📄 License

This project is developed for **educational and portfolio purposes**.

<p align="center">
  Built with Node.js, React, Redis, Kafka, Prisma, and Docker
</p>
<p align="center">
  <b>API Security • Abuse Detection • Rate Limiting • Real-Time Analytics</b>
</p>
