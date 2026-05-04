# backend/ml/predict_email.py

import sys
import math
import json
from pathlib import Path

import pandas as pd
import joblib

MODEL_PATH = Path(__file__).with_name("phish_model_svm_combined_cv.joblib")

_model = None


def get_model():
    """Loads the model once and caches it for the lifetime of the process."""
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def sigmoid(x):
    """Converts a LinearSVC decision score to a probability-like value via sigmoid."""
    try:
        return 1 / (1 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


def main():
    raw = sys.stdin.read()

    if not raw:
        print(json.dumps({"error": "no input"}))
        return

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        print(json.dumps({"error": "invalid json input"}))
        return

    sender  = (data.get("sender",  "") or "").strip()
    subject = (data.get("subject", "") or "").strip()
    body    = (data.get("body",    "") or "").strip()
    text    = f"{sender}\n{subject}\n{body}".strip()

    if not text:
        print(json.dumps({"error": "empty email content"}))
        return

    X     = pd.DataFrame({"text": [text]})
    model = get_model()
    pred  = int(model.predict(X)[0])

    confidence = None
    score      = None

    if hasattr(model, "predict_proba"):
        probs      = model.predict_proba(X)[0]
        confidence = float(probs[pred])
        score      = float(probs[1])
    elif hasattr(model, "decision_function"):
        raw_val    = model.decision_function(X)
        raw_val    = float(raw_val[0] if hasattr(raw_val, "__len__") else raw_val)
        score      = float(sigmoid(raw_val))
        confidence = score if pred == 1 else 1.0 - score

    result = {
        "label":     pred,
        "labelText": "Phishing" if pred == 1 else "Safe",
        "model":     MODEL_PATH.name,
    }

    if confidence is not None:
        result["confidence"]    = round(confidence, 4)
    if score is not None:
        result["phishingScore"] = round(score, 4)

    print(json.dumps(result))


if __name__ == "__main__":
    main()
