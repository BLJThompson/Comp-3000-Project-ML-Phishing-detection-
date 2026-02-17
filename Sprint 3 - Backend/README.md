# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Local Email Client

This sprint implements a **local-only email system** with:
- React frontend (Inbox / Sent / Flagged UI)
- Node.js + Express backend
- SQLite database (`mail.db`) with:
  - `emails` – operational mailbox (Inbox, Sent, Flagged)
  - `normal_corpus` – pool of benign emails
  - `phish_corpus` – pool of phishing emails

You can **spawn** (send) normal, phishing, or random emails from the corpora into the Inbox and **clear** the Inbox or flagged emails using simple commands.

---

## 1. Prerequisites
- Node.js (LTS)
- npm
- VS Code (recommended) using the **PowerShell** integrated terminal

---

## 2. Install dependencies

Run these once on a new machine or after cloning.

From the **"Change to which sprint number" root**:

cd "C:\Users\BENY1\Dev\Year_3_Project\"Change to which sprint number""

# Install root dev dependency (concurrently, etc.)
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install


## 3. Start the whole app (frontend + backend)
From the "Change to which sprint number" root:

cd "C:\Users\BENY1\Dev\Year_3_Project\"Change to which sprint number""
npm run dev

This runs:
- Backend API on: http://localhost:4000
- Frontend UI on: http://localhost:5173

Open the UI in your browser:
http://localhost:5173

**Leave this terminal running.**

## 4. Database overview
SQLite database file: `backend/mail.db` (created automatically).

Tables:
- **emails** – operational mailbox (Inbox, Sent, Flagged). Starts empty until you spawn/send emails.
- **normal_corpus** – corpus of normal/benign emails (seeded with sample data).
- **phish_corpus** – corpus of phishing emails (seeded with sample data).

Spawning commands (below) copy random rows from the corpus tables into `emails` as Inbox messages, with ground-truth labels.

## 5. Dev commands – send (spawn) emails
Open a second VS Code terminal tab (PowerShell) while `npm run dev` is running.
All commands below call the backend dev API.

### 5.1 Send normal x N (benign emails into Inbox)

Send normal x 1:
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/spawn-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{ "type": "normal", "count": 1 }'

Send normal x 5:
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/spawn-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{ "type": "normal", "count": 5 }'


### 5.2 Send phishing x N (phishing emails into Inbox)

Send phishing x 1:
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/spawn-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{ "type": "phish", "count": 1 }'

Send phishing x 3:
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/spawn-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{ "type": "phish", "count": 3 }'


### 5.3 Send random x N (mix of normal + phishing)

Send random x 10 (each email randomly drawn from normal or phishing corpus):
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/spawn-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{ "type": "random", "count": 10 }'

Each spawned email:
- Is inserted into the `emails` table with `folder = 'Inbox'`.
- Has `groundTruthLabel = "benign"` or `"phishing"`.
- Has `sourceDataset = "normal_corpus"` or `"phish_corpus"`.

Refresh http://localhost:5173 to see them in the Inbox.

## 6. Dev commands – clear Inbox and flagged emails

### 6.1 Clear Inbox (delete all Inbox emails)

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/clear-inbox" `
  -Method DELETE

This deletes all rows in `emails` where `folder = 'Inbox'`.

### 6.2 Clear Flagged (delete all flagged emails in any folder)

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/dev/clear-flagged" `
  -Method DELETE

This deletes all rows in `emails` where `isFlagged = 1`.
Your Flagged view will be empty, and flagged messages will be removed from Inbox/Sent too.

## 7. Quick demo workflow

Start app:
cd "C:\Users\BENY1\Dev\Year_3_Project\"Change to which sprint number""
npm run dev

In Terminal 2 (PowerShell):

# Clear inbox
Invoke-RestMethod -Uri "http://localhost:4000/api/dev/clear-inbox" -Method DELETE

# Send 5 normal + 3 phishing
Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email" -Method POST -ContentType "application/json" -Body '{ "type": "normal", "count": 5 }'
Invoke-RestMethod -Uri "http://localhost:4000/api/dev/spawn-email" -Method POST -ContentType "application/json" -Body '{ "type": "phish", "count": 3 }'

Refresh http://localhost:5173 and show Inbox / Flagged behaviour in the UI.