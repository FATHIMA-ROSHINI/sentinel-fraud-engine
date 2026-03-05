# 🛡️ Sentinel AI: Enterprise Fraud Detection Engine

Sentinel is a high-performance, real-time fraud detection architecture designed for modern FinTech ecosystems. It bridges the gap between raw transaction data and actionable AI insights using an **Isolation Forest** machine learning model and a live-streaming operational dashboard.

---

## 🚀 Key Features

### 1. **Autonomous AI Core**
- **Algorithm**: Utilizes `Scikit-Learn`'s **Isolation Forest** for unsupervised anomaly detection.
- **Self-Training**: Automatically generates and trains on a 2,000-transaction baseline at startup to learn "normal" user behavior.
- **Multidimensional Analysis**: Evaluates Risk based on:
    - **Transaction Velocity**: Frequency of spend within a 5-minute window.
    - **Merchant Risk**: Weighted scoring based on industry category (e.g., Crypto vs. Grocery).
    - **Temporal Patterns**: Flagging unusual off-hours activity.

### 2. **Production-Ready Architecture**
- **Persistence**: Powered by **SQLAlchemy** and **SQLite** (Scalable to PostgreSQL).
- **Real-Time Streaming**: Uses **WebSockets** for sub-10ms UI updates. No manual refreshing required.
- **High Performance**: FastAPI backend ensures ultra-low latency inference.

### 3. **Adversarial Simulation Lab**
- **Velocity Attack Mode**: Simulates a bot-driven "brute force" spending spree.
- **Data Drift Simulation**: Skews transaction distributions to test system alerts and model decay.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.9, FastAPI, Pydantic |
| **AI/ML** | Scikit-Learn (Isolation Forest), Pandas, NumPy |
| **Database** | SQLite (Persistent), SQLAlchemy ORM |
| **Real-time** | WebSockets (Bi-directional stream) |
| **DevOps** | Docker, Docker-Compose |

---

## 🚦 Getting Started

### Option A: Using Docker (Recommended)
Launch the entire stack with a single command:
```bash
docker-compose up --build
```
- **Dashboard**: `http://localhost:5173`
- **API Documentation**: `http://localhost:8000/docs`

### Option B: Local Development
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📈 Scalability Path
Sentinel is built with a "Cloud-First" philosophy. To scale for millions of transactions:
1. **Database**: Swap `DATABASE_URL` to a managed **PostgreSQL** instance.
2. **Broker**: Replace the internal simulation with an **Apache Kafka** or **RabbitMQ** consumer.
3. **Deployment**: Deploy the provided Docker images to **AWS ECS** or **Kubernetes**.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

Developed by **roshnii**.
