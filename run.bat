@echo off
echo Starting Sentinel AI Fraud Engine...

start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload"
start cmd /k "cd frontend && npm install && npm run dev"

echo Backend starting at http://localhost:8000
echo Frontend starting at http://localhost:5173
echo.
echo Note: If you don't have Python or Node installed, please install them first.
