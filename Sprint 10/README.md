# AI Email Phishing Detection System
## Sprint 9 – Validation & Model Comparison

This sprint focuses on machine learning evaluation and model comparison. The system now uses a combined dataset (CEAS_08 + Phishing_Email) and evaluates multiple models using a dedicated validation split to determine the best-performing phishing detection model.

---

## Objectives

- Create a clean validation dataset
- Train multiple ML models
- Evaluate models using standard metrics
- Compare performance
- Select a final model for deployment

---

## Technologies Used

**Machine Learning:**
- Python
- scikit-learn
- TF-IDF vectorisation

**Datasets:**
- CEAS_08 dataset
- Phishing_Email dataset

**Models:**
- Support Vector Machine (SVM)
- Logistic Regression
- Random Forest

---

## Dataset Preparation

Two datasets were combined:
- **CEAS_08** – real-world spam/phishing emails
- **Phishing_Email** – labelled phishing dataset

After preprocessing:
- Duplicates removed
- Text cleaned and standardised

**Final dataset:**
- ~56,000 emails
- Balanced classes (phishing vs benign)

### Data Split

| Split      | Proportion |
|------------|------------|
| Train      | ~70%       |
| Test       | ~15%       |
| Validation | ~15%       |

The validation set is stored at:

```
data/validation_split_combined.csv
```

This ensures fair evaluation, no data leakage, and consistent comparison across models.

---

## Models Trained

### 1. Logistic Regression (Baseline)
- TF-IDF features
- Simple linear classifier
- Fast and interpretable

### 2. Support Vector Machine (Improved Model)
- Linear SVM
- TF-IDF features
- Hyperparameter tuning (GridSearchCV)

### 3. Random Forest
- Ensemble tree model
- Used as a non-linear comparison

---

## Evaluation Metrics

All models were evaluated using:
- Accuracy
- Precision
- Recall
- F1-score
- Confusion Matrix

---

## Results (Validation Set)

| Model               | Accuracy | Precision | Recall | F1-score |
|---------------------|----------|-----------|--------|----------|
| SVM                 | 0.9945   | 0.9944    | 0.9946 | 0.9945   |
| Logistic Regression | 0.9938   | 0.9932    | 0.9944 | 0.9938   |
| Random Forest       | 0.9856   | 0.9861    | 0.9852 | 0.9857   |

---

## Model Comparison

- **SVM** achieved the best overall performance
- **Logistic Regression** performed very closely but slightly worse
- **Random Forest** performed significantly lower on text data

> **Key Insight:** Linear models (SVM, Logistic Regression) perform better on high-dimensional sparse TF-IDF features compared to tree-based models.

---

## Final Model Selection

**Selected Model: SVM (Combined Dataset)**

Reasons:
- Highest accuracy and F1-score
- Strong balance between precision and recall
- Consistent performance across datasets

---

## System Improvements in Sprint 9

- Combined datasets for better generalisation
- Introduced validation split for proper evaluation
- Implemented cross-validation during training
- Improved classification accuracy significantly
- Added confidence-based email routing:
  - **Inbox** – low risk
  - **Flagged** – medium risk
  - **Junk** – high risk

---

## Running Model Training

Train all models:

```bash
python -m ml.train_all_models
```

Evaluate on validation set:

```bash
python -m ml.evaluate_validation all
```

---

## Current System Behaviour

| Email Risk    | Destination |
|---------------|-------------|
| Safe          | Inbox       |
| Medium-risk   | Flagged     |
| High-risk     | Junk        |

**AI output includes:**
- `aiLabel`
- `aiScore`
- `aiExplanation`
- `findings`

---

## Research Narrative

This sprint demonstrates:

1. **Baseline model** – Logistic Regression
2. **Improved model** – SVM with combined dataset
3. **Controlled evaluation** – using a dedicated validation split
4. **Quantitative comparison** – using standard ML metrics

This provides a clear, measurable improvement in phishing detection performance.

---

## Future Work (Sprint 10)



---

## Author

**Benjamin Thompson**  
University of Plymouth  
BSc Computer Science – Final Year Project



Sprint 10 Backend / Dev Commands
================================

Start backend
-------------
cd "C:\Users\BENY1\Dev\2000_Software_Eng_Projects\Comp-3000-Project-ML-Phishing-detection-\Sprint 10\backend"
npm run dev

Activate virtual environment
----------------------------
If .venv is inside backend:
cd "C:\Users\BENY1\Dev\2000_Software_Eng_Projects\Comp-3000-Project-ML-Phishing-detection-\Sprint 10\backend"
.\.venv\Scripts\Activate.ps1

If .venv is inside the Sprint 10 root:
cd "C:\Users\BENY1\Dev\2000_Software_Eng_Projects\Comp-3000-Project-ML-Phishing-detection-\Sprint 10"
.\.venv\Scripts\Activate.ps1
cd backend

If PowerShell blocks activation:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

Start full project from Sprint 10 root
--------------------------------------
cd "C:\Users\BENY1\Dev\2000_Software_Eng_Projects\Comp-3000-Project-ML-Phishing-detection-\Sprint 10"
npm run dev

Clear all emails
----------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/clear-all"

Clear Inbox only
----------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/clear-inbox"

Clear Flagged only
------------------
Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/api/dev/clear-flagged"

Clear Junk only
---------------
Only works if /clear-junk route has been added.
Invoke-RestMethod -Method DELETE -Uri "http://localhost:4000/api/dev/clear-junk"

Spawn 5 phishing emails
-----------------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"phish","count":5}' | ConvertTo-Json -Depth 5

Spawn 5 normal emails
---------------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"normal","count":5}' | ConvertTo-Json -Depth 5

Spawn 10 random emails
----------------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"random","count":10}' | ConvertTo-Json -Depth 5

Spawn 1 phishing email
----------------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"phish","count":1}' | ConvertTo-Json -Depth 5

Spawn 1 normal email
--------------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"normal","count":1}' | ConvertTo-Json -Depth 5

Test AI classification directly
-------------------------------
Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:4000/api/ai/classify" `
  -ContentType "application/json" `
  -Body '{"sender":"Security Team <alert@fake-paypal-login.com>","subject":"Urgent action required","body":"Your account will be locked. Verify your password now at http://fake-paypal-login.com"}' | ConvertTo-Json -Depth 5

Useful test flow
----------------
Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/clear-all"

Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"normal","count":5}' | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method POST -Uri "http://localhost:4000/api/dev/spawn-email" -ContentType "application/json" -Body '{"type":"phish","count":5}' | ConvertTo-Json -Depth 5

After spawning, refresh the frontend and check:
- Inbox
- Flagged
- Junk
- Dashboard