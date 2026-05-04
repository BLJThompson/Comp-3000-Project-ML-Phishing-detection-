# AI Email Phishing Detection System

This project implements a **local email client with AI-assisted phishing detection**.

The system simulates an email inbox and uses a **machine learning classifier trained on the CEAS_08 dataset** to detect potential phishing emails. Suspicious elements inside emails are also extracted so they can later be highlighted and explained.

This repository is part of a **University of Plymouth BSc Computer Science final year project**.

---

# Technologies Used

Frontend
- React
- Vite

Backend
- Node.js
- Express.js

Database
- SQLite

Machine Learning
- Python
- scikit-learn
- CEAS_08 phishing dataset

Testing
- Jest
- Supertest

---

# System Architecture


Frontend (React / Vite)
↓
Backend API (Node.js / Express)
↓
SQLite Database (mail.db)
↓
Python ML Classifier (predict_email.py)


The backend sends email content to the Python ML classifier which returns:

- `aiLabel` (phishing or benign)
- `aiScore`
- `aiExplanation`
- `findings` (suspicious patterns detected)

---

# Project Structure


Sprint 5
│
├-- backend
│ ├-- server.js
│ ├-- db.js
│ ├-- ai.js
│ ├-- mail.db
│ │
│ ├-- data
│ │ --- CEAS_08.csv
│ │
│ ├-- ml
│ │ ├-- predict_email.py
│ │ --- phish_model.joblib
│ │
│ ├-- scripts
│ │ --- import_ceas_08.js
│ │
│ --- tests
│ ├-- ai.test.js
│ --- server.test.js
│
├-- frontend
│ --- React application
│
--- README.md


---

# 1. Prerequisites

Install the following software:

- Node.js (LTS recommended)
- npm
- Python 3.10+
- VS Code (recommended)

Check installation:


node -v
npm -v
python --version


---

# 2. First Time Setup

Navigate to the project root.


cd "Sprint 5"


---

## Install root dependencies


npm install


---

## Install backend dependencies


cd backend
npm install


---

## Install frontend dependencies


cd ../frontend
npm install


---

# 3. Python Environment Setup (ML Classifier)

The phishing classifier runs in Python.

Create the virtual environment:


cd backend
python -m venv .venv


Activate it.

Windows:


..venv\Scripts\activate


Mac/Linux:


source .venv/bin/activate


Install required Python packages:


pip install pandas scikit-learn joblib


---

# 4. Import the CEAS Dataset

The project uses the **CEAS_08 phishing dataset**.

Import it into the SQLite database:


node scripts/import_ceas_08.js


This populates:

- `normal_corpus`
- `phish_corpus`

These tables provide the pool of emails used for simulation.

---

# 5. Running the Application

Return to the sprint root folder:


cd ..


Start the application:


npm run dev


This starts:

| Service | Address |
|-------|--------|
Backend API | http://localhost:4000 |
Frontend UI | http://localhost:5173 |

Open the frontend:


http://localhost:5173


Leave this terminal running.

---

# 6. Spawning Test Emails

Open a **second terminal** while the app is running.

These commands simulate incoming emails.

---

## Spawn a normal email


Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email
" -Method POST -ContentType "application/json" -Body '{ "type": "normal", "count": 1 }'


---

## Spawn a phishing email


Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email
" -Method POST -ContentType "application/json" -Body '{ "type": "phish", "count": 1 }'


---

## Spawn random emails


Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email
" -Method POST -ContentType "application/json" -Body '{ "type": "random", "count": 5 }'


Refresh the UI to see the emails appear in the inbox.

---

# 7. Clearing Emails

Clear inbox:


Invoke-RestMethod -Uri "http://localhost:4000/api/dev/clear-inbox
" -Method DELETE


Clear flagged emails:


Invoke-RestMethod -Uri "http://localhost:4000/api/dev/clear-flagged
" -Method DELETE


---

# 8. Running Automated Tests

Backend tests verify:

- suspicious phrase detection
- suspicious link detection
- API endpoints
- email creation and retrieval

Run tests:


cd backend
npm test


Expected output:


Test Suites: 2 passed
Tests: 8 passed


---

# 9. Example Demo Workflow

Start the system:


npm run dev


Spawn emails:


Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email
" -Method POST -Body '{"type":"random","count":5}'


Open the frontend:


http://localhost:5173


Observe:

- emails appear in the inbox
- phishing emails are flagged
- benign emails remain unflagged

---

# 10. Troubleshooting

## Python not found

Ensure Python is installed and available in PATH.

---

## Model not loading

Check the file exists:


backend/ml/phish_model.joblib


---

## Database empty

Run the dataset importer:


node scripts/import_ceas_08.js


---

## Backend fails to start

Ensure port `4000` is free.

---

# 11. Future Improvements

- frontend highlighting of suspicious text
- LLM explanation of phishing indicators
- improved ML model accuracy
- asynchronous inference pipeline

---

# Author

Benjamin Thompson  
University of Plymouth  
BSc Computer Science – Final Year Project