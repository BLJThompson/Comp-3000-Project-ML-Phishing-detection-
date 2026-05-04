# AI Email Phishing Detection System
## Sprint 10

A full-stack phishing detection application. Incoming emails are classified by a trained SVM model, routed into Inbox, Flagged, or Junk based on confidence, and explained to the user in plain language via Gemini.

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React, Vite |
| Backend  | Node.js, Express, SQLite |
| ML       | Python, scikit-learn, TF-IDF |
| LLM      | Google Gemini (`gemini-2.5-flash`) |
| Gmail    | Google OAuth2, Gmail API |

---

## Project Structure

```
Sprint 10/
├── backend/
│   ├── ai/
│   │   ├── classifier.js       # ML pipeline, Gemini integration
│   │   └── findingRules.js     # Rule-based phishing signal extraction
│   ├── controllers/
│   │   ├── aiController.js
│   │   ├── devController.js
│   │   ├── emailController.js
│   │   └── gmailController.js
│   ├── db/
│   │   ├── emailStore.js       # mapEmailRow, insertEmail
│   │   ├── index.js
│   │   └── schema.js
│   ├── google/
│   │   ├── gmailService.js
│   │   ├── llm.js              # Gemini explanation generation
│   │   └── token.json
│   ├── ml/
│   │   ├── predict_email.py    # Called per email by Node via stdin/stdout
│   │   ├── train_svm_combined_cv.py
│   │   ├── evaluate_validation.py
│   │   ├── utils.py
│   │   └── phish_model_svm_combined_cv.joblib
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── devRoutes.js
│   │   ├── emailRoutes.js
│   │   └── gmailRoutes.js
│   ├── app.js
│   ├── emailRouting.js
│   └── server.js
├── frontend/
└── data/
    ├── CEAS_08.csv
    ├── Phishing_Email.csv
    └── validation_split_combined.csv
```

---

## ML Model

**Selected model: Linear SVM (Combined Dataset)**

Two datasets were combined and preprocessed:
- **CEAS_08** — real-world spam/phishing emails
- **Phishing_Email** — labelled phishing dataset

| Split      | Proportion |
|------------|------------|
| Train      | ~70%       |
| Test       | ~15%       |
| Validation | ~15%       |

Features: word-level TF-IDF (1–2 grams) + character-level TF-IDF (3–5 grams).

### Validation Results

| Model               | Accuracy | Precision | Recall | F1     |
|---------------------|----------|-----------|--------|--------|
| **SVM** ✓           | 0.9945   | 0.9944    | 0.9946 | 0.9945 |
| Logistic Regression | 0.9938   | 0.9932    | 0.9944 | 0.9938 |
| Random Forest       | 0.9856   | 0.9861    | 0.9852 | 0.9857 |

SVM was selected for its highest F1-score and strong balance of precision and recall. Linear models outperform tree-based models on high-dimensional sparse TF-IDF features.

---

## Email Routing

| AI Score    | Destination |
|-------------|-------------|
| < 0.70      | Inbox       |
| 0.70 – 0.89 | Flagged     |
| ≥ 0.90      | Junk        |

AI output per email: `aiLabel`, `aiScore`, `aiModel`, `aiExplanation`, `findings`.

---

## Getting Started

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Python environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows
source .venv/bin/activate          # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure environment

Create `backend/.env`:

```
GEMINI_API_KEY=your_key_here
```

### 3. Activate the Python environment

The Python classifier is called at runtime by Node. The virtual environment must be active or the `.venv` path must be resolvable from the backend directory.

```powershell
# If .venv is inside backend/
cd backend
.\.venv\Scripts\Activate.ps1

# If PowerShell blocks activation
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 4. Start the project

```bash
# From Sprint 10 root (starts frontend + backend together)
npm run dev

# Backend only
cd backend
npm run dev
```

Frontend runs at `http://localhost:5173`  
Backend runs at `http://localhost:4000`

---

## Updating API Keys

### Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a new key
2. Open `backend/.env`
3. Replace the existing value:
   ```
   GEMINI_API_KEY=your_new_key_here
   ```
4. Restart the backend

### Gmail OAuth token

The token expires after 7 days in test mode or when access is revoked.

1. Delete `backend/google/token.json`
2. Restart the backend
3. Run the following in PowerShell — **complete all steps quickly, the auth code expires in ~60 seconds**:

```powershell
# Step 1 — get the Google login URL
Invoke-RestMethod -Uri "http://localhost:4000/api/gmail/auth-url"
```

Open the URL in your browser, sign in, and approve access. Google will redirect to a URL like:

```
http://localhost/?code=4/0Aeo...&scope=...
```

Copy everything between `code=` and `&scope`.

```powershell
# Step 2 — save the code immediately
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/gmail/auth-code" `
  -ContentType "application/json" -Body '{"code":"paste-code-here"}'
```

A fresh `token.json` will be written to `backend/google/` and Gmail will be reconnected.

---

## API Reference

### Emails — `/api/emails`

| Method | Path                  | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/`                   | List emails (query: `folder`, `search`) |
| GET    | `/counts`             | Folder and label counts            |
| GET    | `/:id`                | Get one email                      |
| GET    | `/:id/thread`         | Get full conversation thread       |
| POST   | `/`                   | Send a new email                   |
| POST   | `/send`               | Send a new email                   |
| POST   | `/draft`              | Save a draft                       |
| PATCH  | `/:id`                | Update flags (isUnread, isFlagged, isPinned) |
| PATCH  | `/:id/draft`          | Update a draft                     |
| PATCH  | `/:id/move`           | Move to a folder                   |
| PATCH  | `/:id/delete`         | Move to Deleted (or permanently delete) |
| PATCH  | `/:id/restore`        | Restore from Deleted               |

### AI — `/api/ai`

| Method | Path        | Description                  |
|--------|-------------|------------------------------|
| POST   | `/classify` | Classify an email with the SVM model |

### Gmail — `/api/gmail`

| Method | Path             | Description                        |
|--------|------------------|------------------------------------|
| GET    | `/auth-url`      | Get the Google OAuth login URL     |
| POST   | `/auth-code`     | Save the OAuth code and write token.json |
| POST   | `/import-unread` | Import and classify unread Gmail messages |
| POST   | `/send`          | Send an email via Gmail            |

### Dev — `/api/dev`

| Method | Path              | Description                        |
|--------|-------------------|------------------------------------|
| POST   | `/spawn-email`    | Spawn test emails from the corpus  |
| DELETE | `/clear-inbox`    | Delete all Inbox emails            |
| DELETE | `/clear-flagged`  | Delete all Flagged emails          |
| DELETE | `/clear-all`      | Delete all emails                  |

---

## ML Commands

```bash
# Evaluate SVM against the validation set
python -m ml.evaluate_validation

# Retrain the SVM model
python -m ml.train_svm_combined_cv
```

---

## Dev API Commands (PowerShell)

### Clear emails

```powershell
Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/api/dev/clear-all"
Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/api/dev/clear-inbox"
Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/api/dev/clear-flagged"
```

### Spawn emails

```powershell
# Phishing emails
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"phish","count":5}'

# Normal emails
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"normal","count":5}'

# Random mix
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"random","count":10}'

# Single phishing email
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"phish","count":1}'

# Single normal email
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"normal","count":1}'
```

### Test AI classification directly

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/ai/classify" `
  -ContentType "application/json" `
  -Body '{"sender":"Security Team <alert@fake-paypal-login.com>","subject":"Urgent action required","body":"Your account will be locked. Verify your password now at http://fake-paypal-login.com"}'
```

### Useful test flow

```powershell
Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/api/dev/clear-all"
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"normal","count":5}'
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" `
  -ContentType "application/json" -Body '{"type":"phish","count":5}'
# Refresh the frontend and check Inbox, Flagged, and Junk
```

---

## Author

**Benjamin Thompson**  
University of Plymouth — BSc Computer Science, Final Year Project
