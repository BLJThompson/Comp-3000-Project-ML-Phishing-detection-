# AI Email Phishing Detection System (Sprint 8)

This project implements a **local web-based email client with AI-assisted phishing detection**.

## Technologies Used
- React, Vite
- Node.js, Express
- SQLite
- Python (scikit-learn, CEAS_08 dataset)
- Google Gemini API (optional)
- Jest, Supertest

## Setup

### 1. Install dependencies
```
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Python setup (ML classifier)
```
cd backend
python -m venv .venv
```

Activate:

Windows:
```
.venv\Scripts\activate
```

Mac/Linux:
```
source .venv/bin/activate
```

Install packages:
```
pip install pandas scikit-learn joblib
```

### 3. Import dataset
```
node scripts/import_ceas_08.js
```

### 4. Run system
```
npm run dev
```

Backend: http://localhost:4000  
Frontend: http://localhost:5173  

## Testing
```
cd backend
npm test
```

## Behaviour
- Benign → Inbox  
- Medium phishing → Flagged  
- High phishing → Junk  

## Author
Benjamin Thompson
