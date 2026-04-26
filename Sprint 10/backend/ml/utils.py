import os
import pandas as pd
from functools import lru_cache

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

THIS_DIR = os.path.dirname(__file__)
PHISHING_PATH = os.path.join(THIS_DIR, "..", "data", "Phishing_Email.csv")
CEAS_PATH = os.path.join(THIS_DIR, "..", "data", "CEAS_08.csv")


class TextCleaner(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return (
            pd.Series(X)
            .fillna("")
            .astype(str)
            .str.replace(r"\s+", " ", regex=True)
            .str.strip()
            .values
        )


def map_label(value):
    text = str(value).strip().lower()

    if text in ["phishing email", "phishing", "phish", "spam", "1"]:
        return 1
    if text in ["safe email", "safe", "legitimate", "ham", "normal", "0"]:
        return 0

    return None


def load_phishing_dataset():
    print(f"[INFO] Loading dataset from: {PHISHING_PATH}")
    df = pd.read_csv(PHISHING_PATH)

    required_cols = ["Email Text", "Email Type"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    df = df.dropna(subset=["Email Text", "Email Type"]).copy()

    df["text"] = (
        df["Email Text"]
        .astype(str)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )
    df["label"] = df["Email Type"].apply(map_label)

    df = df.dropna(subset=["label"]).copy()
    df["label"] = df["label"].astype(int)
    df = df[df["text"] != ""].copy()

    before = len(df)
    df = df.drop_duplicates(subset=["text"]).copy()
    after = len(df)

    print(f"[INFO] Removed {before - after} duplicate rows")
    print(f"[INFO] Final Phishing_Email size: {len(df)}")
    print(f"[INFO] Safe emails: {(df['label'] == 0).sum()}")
    print(f"[INFO] Phishing emails: {(df['label'] == 1).sum()}")

    return df[["text", "label"]]


def load_ceas_dataset():
    print(f"[INFO] Loading dataset from: {CEAS_PATH}")
    df = pd.read_csv(CEAS_PATH)
    df.columns = [c.strip() for c in df.columns]

    sender = df["sender"].fillna("").astype(str) if "sender" in df.columns else pd.Series([""] * len(df))
    subject = df["subject"].fillna("").astype(str) if "subject" in df.columns else pd.Series([""] * len(df))
    body = df["body"].fillna("").astype(str) if "body" in df.columns else pd.Series([""] * len(df))

    df["text"] = (
        sender.str.strip() + " " +
        subject.str.strip() + " " +
        body.str.strip()
    ).str.replace(r"\s+", " ", regex=True).str.strip()

    if "label" not in df.columns:
        raise ValueError("Missing required column: label")

    df["label"] = df["label"].apply(map_label)

    df = df.dropna(subset=["label"]).copy()
    df["label"] = df["label"].astype(int)
    df = df[df["text"] != ""].copy()

    before = len(df)
    df = df.drop_duplicates(subset=["text"]).copy()
    after = len(df)

    print(f"[INFO] Removed {before - after} duplicate rows")
    print(f"[INFO] Final CEAS_08 size: {len(df)}")
    print(f"[INFO] Safe emails: {(df['label'] == 0).sum()}")
    print(f"[INFO] Phishing emails: {(df['label'] == 1).sum()}")

    return df[["text", "label"]]


@lru_cache(maxsize=1)
def load_combined_dataset():
    df1 = load_phishing_dataset()
    df2 = load_ceas_dataset()

    df = pd.concat([df1, df2], ignore_index=True)
    df = df.drop_duplicates(subset=["text"]).copy()
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"[INFO] Combined dataset size: {len(df)}")
    print(f"[INFO] Combined safe emails: {(df['label'] == 0).sum()}")
    print(f"[INFO] Combined phishing emails: {(df['label'] == 1).sum()}")

    return df[["text", "label"]]


def build_feature_pipeline():
    return ColumnTransformer(
        transformers=[
            (
                "word",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    stop_words="english",
                    max_features=18000,
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.95,
                    sublinear_tf=True,
                ),
                "text",
            ),
            (
                "char",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    max_features=10000,
                    min_df=2,
                    sublinear_tf=True,
                ),
                "text",
            ),
        ],
        remainder="drop",
        sparse_threshold=1.0,
    )


def print_results(name, y_true, y_pred):
    print(f"\n=== {name} RESULTS ===")
    print(f"Accuracy : {accuracy_score(y_true, y_pred):.4f}")
    print(f"Precision: {precision_score(y_true, y_pred, zero_division=0):.4f}")
    print(f"Recall   : {recall_score(y_true, y_pred, zero_division=0):.4f}")
    print(f"F1-score : {f1_score(y_true, y_pred, zero_division=0):.4f}")

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_true, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, digits=4, zero_division=0))