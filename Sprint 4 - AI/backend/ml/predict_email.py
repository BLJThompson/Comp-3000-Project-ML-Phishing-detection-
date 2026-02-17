# backend/ml/predict_email.py
#
# Simple CLI wrapper around your trained CEAS_08 model (phish_model.joblib).
# It reads JSON from stdin:
#   { "sender": "...", "subject": "...", "body": "..." }
# and prints JSON to stdout:
#   { "label": 0 or 1, "score": float }   # 1 = phishing

import sys
import json
from pathlib import Path
import joblib

# phish_model.joblib should already be here from train_ceas_model
MODEL_PATH = Path(__file__).with_name("phish_model.joblib")
_model = None


def get_model():
  global _model
  if _model is None:
    _model = joblib.load(MODEL_PATH)
  return _model


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

  sender = data.get("sender", "") or ""
  subject = data.get("subject", "") or ""
  body = data.get("body", "") or ""

  text = f"{sender}\n{subject}\n{body}"

  model = get_model()
  proba = model.predict_proba([text])[0]  # shape (2,)

  classes = list(model.classes_)  # should be [0, 1]
  if 1 in classes:
    phish_idx = classes.index(1)
  else:
    # fall back if for some reason labels are reversed
    phish_idx = 1

  score = float(proba[phish_idx])
  label = 1 if score >= 0.5 else 0

  out = {"label": label, "score": score}
  print(json.dumps(out))


if __name__ == "__main__":
  main()
