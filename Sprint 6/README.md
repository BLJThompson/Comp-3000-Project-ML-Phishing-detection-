# AI Email Phishing Detection System

This project implements a **local email client with AI-assisted phishing
detection**.

The system simulates an email inbox and uses a **machine learning
classifier trained on the CEAS_08 dataset** to detect phishing emails.
The AI also extracts suspicious elements so the frontend can highlight
the parts of an email that triggered the detection.

This project was developed as part of a **University of Plymouth BSc
Computer Science Final Year Project**.

------------------------------------------------------------------------

# Technologies Used

Frontend - React - Vite

Backend - Node.js - Express.js

Database - SQLite

Machine Learning - Python - scikit-learn - CEAS_08 phishing dataset

Testing - Jest - Supertest

------------------------------------------------------------------------

# System Architecture

Frontend (React) ↓ Backend API (Node.js / Express) ↓ SQLite Database ↓
Python ML Classifier

The classifier returns:

-   aiLabel -- phishing or benign
-   aiScore -- model confidence
-   aiExplanation -- reason for the decision
-   findings -- suspicious patterns detected in the email

These findings are used to highlight suspicious text in the email
viewer.

------------------------------------------------------------------------

# Project Structure

Sprint 6
│
├-- backend
│   ├-- server.js
│   ├-- db.js
│   ├-- ai.js
│   ├-- mail.db
│
│   ├-- ml
│   │   ├-- predict_email.py
│   │   └-- phish_model.joblib
│
│   ├-- scripts
│   │   └-- import_ceas_08.js
│
│   └-- tests
│       ├-- ai.test.js
│       └-- server.test.js
│
├-- frontend
│
└-- README.md

------------------------------------------------------------------------

# Setup

## 1. Prerequisites

Install:

-   Node.js (LTS)
-   npm
-   Python 3.10+

Check installation:

node -v npm -v python --version

------------------------------------------------------------------------

## 2. Install Dependencies

Navigate to the project folder:

cd "Sprint 6"

Install packages:

npm install

cd backend npm install

cd ../frontend npm install

------------------------------------------------------------------------

## 3. Python Environment

Create a virtual environment:

cd backend python -m venv .venv

Activate it.

Windows:

..venv`\Scripts`{=tex}`\activate`{=tex}

Mac/Linux:

source .venv/bin/activate

Install required packages:

pip install pandas scikit-learn joblib

------------------------------------------------------------------------

## 4. Import Dataset

node scripts/import_ceas_08.js

------------------------------------------------------------------------

# Running the Application

From the project root:

npm run dev

Services start at:

Backend API → http://localhost:4000\
Frontend → http://localhost:5173

Open:

http://localhost:5173

------------------------------------------------------------------------

# Testing Email Detection

Spawn normal email:

Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email"
-Method POST -ContentType "application/json" -Body '{ "type": "normal",
"count": 1 }'

Spawn phishing email:

Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email"
-Method POST -ContentType "application/json" -Body '{ "type": "phish",
"count": 1 }'

Spawn random emails:

Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email"
-Method POST -ContentType "application/json" -Body '{ "type": "random",
"count": 5 }'

Safe emails appear in Inbox, phishing emails appear in Flagged.

------------------------------------------------------------------------

# Clearing Emails

Clear inbox:

Invoke-RestMethod -Uri "http://localhost:4000/api/dev/clear-inbox"
-Method DELETE

Clear flagged emails:

Invoke-RestMethod -Uri "http://localhost:4000/api/dev/clear-flagged"
-Method DELETE

------------------------------------------------------------------------

# Running Tests

cd backend npm test

Tests verify:

-   phishing indicator detection
-   suspicious link detection
-   API functionality
-   email processing

------------------------------------------------------------------------

# Author

Benjamin Thompson\
University of Plymouth\
BSc Computer Science -- Final Year Project
