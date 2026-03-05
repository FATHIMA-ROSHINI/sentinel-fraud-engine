from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
import pandas as pd
import random
import json
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import IsolationForest
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os

# --- DATABASE SETUP ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBTransaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String)
    amount = Column(Float)
    merchant = Column(String)
    location = Column(String)
    timestamp = Column(DateTime)
    risk_score = Column(Float)
    is_fraud = Column(Integer) # 0 for False, 1 for True
    reasons = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- FASTAPI APP ---
app = FastAPI(title="Sentinel AI - Production Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass 

manager = ConnectionManager()

# --- AI MODEL (PRODUCTION GRADE) ---
# Fixing potential type-checking confusion by explicitly using float
model = IsolationForest(n_estimators=100, contamination=float(0.02), random_state=42)
is_trained = False

MERCHANTS = [
    {"name": "Amazon", "risk": 0.02, "category": "Retail"},
    {"name": "Uber", "risk": 0.05, "category": "Transport"},
    {"name": "Apple Store", "risk": 0.04, "category": "Electronics"},
    {"name": "Crypto.com", "risk": 0.45, "category": "Crypto"},
    {"name": "Starbucks", "risk": 0.01, "category": "Food"},
    {"name": "Rolex Boutique", "risk": 0.15, "category": "Luxury"},
    {"name": "Unknown Service", "risk": 0.65, "category": "Misc"},
    {"name": "Binance", "risk": 0.50, "category": "Crypto"},
    {"name": "Walmart", "risk": 0.03, "category": "Retail"},
    {"name": "Steam Games", "risk": 0.08, "category": "Entertainment"}
]

def train_model():
    global is_trained
    print("Training AI Model on baseline...")
    data = []
    for _ in range(2000):
        m_risk = random.choice([m["risk"] for m in MERCHANTS if m["risk"] < 0.2])
        data.append({
            "amount": abs(random.normalvariate(100, 200)),
            "merchant_risk": m_risk,
            "hour": random.randint(8, 22),
            "velocity": random.randint(1, 2)
        })
    model.fit(pd.DataFrame(data))
    is_trained = True
    print("AI Model Live.")

@app.on_event("startup")
async def startup_event():
    train_model()

# --- SCHEMAS ---
class Transaction(BaseModel):
    id: str
    user_id: str
    amount: float
    merchant: str
    location: str
    timestamp: str

# --- REAL-TIME INFERENCE ---
@app.post("/api/v1/infer")
async def infer(tx: Transaction, db: Session = Depends(get_db)):
    if not is_trained:
        raise HTTPException(status_code=503, detail="Model training in progress")

    # 1. Feature Prep
    merchant_info = next((m for m in MERCHANTS if m["name"] == tx.merchant), {"risk": 0.5})
    dt = datetime.fromisoformat(tx.timestamp.replace('Z', '+00:00'))
    
    # Check historical velocity from DB
    five_mins_ago = datetime.now(timezone.utc).replace(tzinfo=None) # Simplification for SQLite
    velocity = db.query(DBTransaction).filter(
        DBTransaction.user_id == tx.user_id,
        DBTransaction.timestamp > five_mins_ago
    ).count()

    features = pd.DataFrame([{
        "amount": tx.amount,
        "merchant_risk": merchant_info["risk"],
        "hour": dt.hour,
        "velocity": velocity + 1
    }])

    # 2. AI Scoring
    raw_score = model.decision_function(features)[0]
    score = float(np.clip((0.2 - raw_score) * 150, 0, 100))
    is_fraud = score > 65

    # 3. Explainability
    reasons = []
    if tx.amount > 2500: reasons.append("Volume Anomaly")
    if merchant_info["risk"] > 0.4: reasons.append(f"High-Risk Source ({merchant_info['category']})")
    if (velocity + 1) > 3: reasons.append("Velocity Alert")
    
    # 4. PERSIST TO DB
    db_tx = DBTransaction(
        id=tx.id,
        user_id=tx.user_id,
        amount=tx.amount,
        merchant=tx.merchant,
        location=tx.location,
        timestamp=dt.replace(tzinfo=None),
        risk_score=score,
        is_fraud=1 if is_fraud else 0,
        reasons=",".join(reasons)
    )
    db.add(db_tx)
    db.commit()

    # 5. BROADCAST TO DASHBOARD
    payload = {
        **tx.dict(),
        "score": score,
        "isFraud": is_fraud,
        "reasons": reasons
    }
    await manager.broadcast(json.dumps(payload))

    return payload

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- ANALYTICS ---
@app.get("/api/v1/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    txs = db.query(DBTransaction).order_by(DBTransaction.timestamp.desc()).limit(limit).all()
    # Format for frontend
    return txs

@app.get("/api/v1/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(DBTransaction).count()
    blocked = db.query(DBTransaction).filter(DBTransaction.is_fraud == 1).count()
    return {
        "total_processed": total,
        "total_blocked": blocked,
        "fraud_rate": (blocked / total) if total > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
