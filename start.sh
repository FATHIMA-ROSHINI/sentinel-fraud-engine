#!/bin/bash

echo "Starting Sentinel AI Fraud Engine..."

# Start Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend starting at http://localhost:8000"
echo "Frontend starting at http://localhost:5173"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
