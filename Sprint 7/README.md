# AI Email Phishing Detection System

This project implements a **local email client with AI-assisted phishing detection**.

The system simulates an email inbox and uses a **machine learning classifier trained on the CEAS_08 dataset** to detect phishing emails. Suspicious elements within emails are extracted and visually highlighted, with explanations generated using a **local ML model and optional LLM (Gemini)**.

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
- CEAS_08 dataset

AI Explanation
- Google Gemini API (optional fallback)

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
↓  
Optional LLM Explanation (Gemini)

The backend processes emails and returns:

- `aiLabel` (phishing / benign)
- `aiScore`
- `aiExplanation`
- `findings` (suspicious indicators)

---

# Features (Sprint 7)

- Email inbox simulation
- Phishing detection using ML model
- Suspicious content highlighting
- AI-generated explanations (LLM for phishing only)
- Separate folders:
  - Inbox (safe emails)
  - Flagged (phishing emails)
- Dashboard with:
  - total emails
  - phishing rate
  - recent flagged emails
- Education page explaining phishing techniques
- Scrollable UI and improved styling (light/dark mode)

---

# Project Structure

```text
backend/
  ├-- server.js
  ├-- db.js
  ├-- ai.js
  ├-- llm.js
  ├-- mail.db
  ├-- ml/
  │   ├-- predict_email.py
  │   └-- phish_model.joblib
  ├-- scripts/
  │   └-- import_ceas_08.js
  └-- tests/

frontend/
  └-- React application

README.md
```

---

# Setup

## 1. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

## 2. Python setup

```bash
cd backend
python -m venv .venv
```

Activate:

Windows:
```bash
.venv\Scripts\activate
```

Mac/Linux:
```bash
source .venv/bin/activate
```

Install packages:

```bash
pip install pandas scikit-learn joblib
```

---

## 3. Import dataset

```bash
node scripts/import_ceas_08.js
```

---

## 4. Run the system

```bash
npm run dev
```

- Backend: http://localhost:4000  
- Frontend: http://localhost:5173  

---

# API Testing

Spawn emails:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email" `
-Method POST -ContentType "application/json" `
-Body '{ "type": "random", "count": 5 }'
```

---

# Testing

```bash
cd backend
npm test
```

---

# Current System Behaviour

- Safe emails → Inbox  
- Phishing emails → Flagged  
- Suspicious text is highlighted  
- LLM explanations are generated **only for phishing emails**  
- Fallback to local explanation if LLM fails or quota exceeded  

---

# Future Work

## Sprint 8 – Email Client Features
- Compose email
- Send / Save draft
- Reply / Forward
- Delete and restore emails
- Move emails between folders
- Outlook-style toolbar

## Sprint 9 – Testing & Evaluation
- Functional test cases
- Integration testing
- Usability testing

## Sprint 10 – Real Email Integration
- Google OAuth login
- Gmail API integration
- Analyse real inbox emails

---

# Author

Benjamin Thompson  
University of Plymouth  
BSc Computer Science – Final Year Project
