Sentinel: AI-Based Fraud Detection Engine
> Sentinel is an end-to-end, real-time fraud detection architecture designed for high-velocity financial transaction streams. It bridges the gap between Data Science and DevOps by integrating advanced ML patterns with a robust monitoring dashboard.
> 
📋 Table of Contents
 * Overview
 * System Architecture
 * Key Features
 * Tech Stack
 * Getting Started
 * Project Structure
 * Simulation Controls
🔭 Overview
In modern FinTech, detecting fraud requires sub-second latency and high interpretability. Sentinel provides a full-stack solution that:
 * Ingests transaction data via a simulated Kafka stream.
 * Analyzes patterns using a hybrid rules-based and ML inference engine (simulating XGBoost/Isolation Forest logic).
 * Explains decisions using SHAP-like feature attribution (e.g., "Why was this blocked?").
 * Monitors system health, specifically detecting Data Drift in real-time.
🏗 System Architecture
The system mimics a production microservices architecture:
graph LR
    A[Transaction Stream] -->|Kafka/WebSocket| B(Inference Engine)
    B -->|Feature Extraction| C{ML Model}
    C -->|Risk Score| B
    B -->|Log| D[(PostgreSQL)]
    B -->|Real-time JSON| E[React Dashboard]
    
    style A fill:#f9f,stroke:#333
    style B fill:#bbf,stroke:#333
    style C fill:#dfd,stroke:#333
    style E fill:#fff,stroke:#333

🌟 Key Features
1. Real-Time Inference Engine
 * Processes transactions with simulated latency (10-50ms).
 * Evaluates Velocity (frequency of user actions), Geolocation, and Merchant Risk.
2. Explainable AI (XAI)
 * Unlike "Black Box" models, Sentinel provides context.
 * Every blocked transaction includes a Reason Code (e.g., Velocity Alert, High Value, Geo Mismatch).
3. Data Drift Detection
 * Monitors the statistical baseline of transaction amounts.
 * Triggers system alerts if the live data distribution deviates significantly from the training set (simulated via the "Drift Mode" toggle).
4. Interactive Simulation
 * Velocity Attack Mode: Simulates a bot attack targeting specific user accounts.
 * Drift Mode: Artificially skews transaction values to test monitoring alerts.
💻 Tech Stack
| Component | Technology | Description |
|---|---|---|
| Frontend | React 18, Tailwind CSS, Lucide Icons | Responsive Operations Dashboard |
| Backend | Python, FastAPI, Pydantic | High-performance Inference API |
| ML Logic | Scikit-Learn / XGBoost (Logic) | Risk Scoring & Anomaly Detection |
| Data | JSON / In-Memory Store | Transaction Logging & State Management |
🚀 Getting Started
Prerequisites
 * Node.js (v16+)
 * Python (v3.9+)
1. Frontend Setup (The Dashboard)
The frontend is a self-contained React application.
# Clone the repository
git clone [https://github.com/your-username/sentinel-fraud-engine.git](https://github.com/your-username/sentinel-fraud-engine.git)
cd sentinel-fraud-engine

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm start

Access the dashboard at http://localhost:3000
2. Backend Setup (The Engine)
The backend provides the API endpoints for inference.
# Navigate to backend folder
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install fastapi uvicorn pydantic numpy

# Run the server
uvicorn main:app --reload

API docs available at http://localhost:8000/docs
📂 Project Structure
sentinel-fraud-engine/
├── backend/
│   ├── main.py              # FastAPI Entry Point & Inference Logic
│   └── requirements.txt     # Python Dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx          # Main Dashboard Component & Simulation Logic
│   │   ├── index.css        # Tailwind Imports
│   │   └── index.js         # React Entry Point
│   └── package.json
└── README.md                # Documentation

🎮 Simulation Controls
Once the dashboard is running, use the control panel to stress-test the system:
 * Play/Pause: Stops the incoming transaction feed.
 * Inject Velocity Attack:
   * Effect: Floods the system with transactions from a specific user (User_ATTACKER_99).
   * Observation: Watch for the "Velocity Alert" flag in the Inspector panel.
 * Simulate Data Drift:
   * Effect: Drastically increases average transaction amounts.
   * Observation: Wait ~5 seconds for the "System Alert" to trigger a Drift Warning due to baseline deviation.
🛡 License
This project is licensed under the MIT License - see the LICENSE file for details.
Developed by [roshni[ Data Scientist & FinTech Engineer
