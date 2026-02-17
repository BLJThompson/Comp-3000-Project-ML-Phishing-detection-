# backend/ml/train_ceas_model.py

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# Path to CEAS_08.csv 
THIS_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(THIS_DIR, "..", "data", "CEAS_08.csv")
MODEL_PATH = os.path.join(THIS_DIR, "phish_model.joblib")


def load_data():
    print(f"[train_ceas_model] Loading data from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)


    required_cols = {"sender", "subject", "body", "label"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in CSV: {missing}")

    def make_text(row):
        parts = [
            str(row.get("sender", "")),
            str(row.get("subject", "")),
            str(row.get("body", "")),
        ]
        return "\n".join(parts)

    df["text"] = df.apply(make_text, axis=1)


    X = df["text"].astype(str)
    y = df["label"].astype(int)

    return X, y


def build_pipeline():
    # TF-IDF + Logistic Regression baseline
    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    stop_words="english",
                    max_features=50000,
                    ngram_range=(1, 2),
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    solver="lbfgs",
                    n_jobs=-1,
                ),
            ),
        ]
    )
    return pipeline


def main():
    X, y = load_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("[train_ceas_model] Training samples:", X_train.shape[0])
    print("[train_ceas_model] Test samples:", X_test.shape[0])

    pipeline = build_pipeline()

    print("[train_ceas_model] Training model...")
    pipeline.fit(X_train, y_train)

    print("[train_ceas_model] Evaluating on test set...")
    y_pred = pipeline.predict(X_test)

    try:
        y_proba = pipeline.predict_proba(X_test)[:, 1]
    except Exception:
        y_proba = None

    print("\n=== Classification report (0 = normal, 1 = phishing) ===")
    print(classification_report(y_test, y_pred, digits=3))

    print("=== Confusion matrix ===")
    print(confusion_matrix(y_test, y_pred))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n[train_ceas_model] Saved model to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
