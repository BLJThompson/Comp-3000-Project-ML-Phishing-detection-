# backend/ml/utils.py

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
from sklearn.model_selection import train_test_split

THIS_DIR              = os.path.dirname(__file__)
PHISHING_PATH         = os.path.join(THIS_DIR, "..", "data", "Phishing_Email.csv")
CEAS_PATH             = os.path.join(THIS_DIR, "..", "data", "CEAS_08.csv")
VALIDATION_SPLIT_PATH = os.path.join(THIS_DIR, "..", "data", "validation_split_combined.csv")


# ─── Sklearn transformer ──────────────────────────────────────────────────────

class TextCleaner(BaseEstimator, TransformerMixin):
    """Normalises whitespace in a text column. Used inside the model pipeline."""

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


# ─── Label mapping ────────────────────────────────────────────────────────────

def map_label(value):
    """Maps raw label strings to 1 (phishing) or 0 (safe). Returns None for unknowns."""
    text = str(value).strip().lower()
    if text in {"phishing email", "phishing", "phish", "spam", "1"}:
        return 1
    if text in {"safe email", "safe", "legitimate", "ham", "normal", "0"}:
        return 0
    return None


# ─── Private dataset utilities ────────────────────────────────────────────────

def _col_or_empty(df, col):
    """Returns a string Series for col, or an all-empty Series if col is absent."""
    return df[col].fillna("").astype(str) if col in df.columns else pd.Series([""] * len(df))


def _finalise_dataset(df, name):
    """Drops invalid labels and empty rows, deduplicates, logs counts, and returns text/label only."""
    df = df.dropna(subset=["label"]).copy()
    df["label"] = df["label"].astype(int)
    df = df[df["text"] != ""].copy()

    before = len(df)
    df = df.drop_duplicates(subset=["text"]).copy()

    print(f"[INFO] Removed {before - len(df)} duplicate rows")
    print(f"[INFO] Final {name} size: {len(df)}")
    print(f"[INFO] Safe emails: {(df['label'] == 0).sum()}")
    print(f"[INFO] Phishing emails: {(df['label'] == 1).sum()}")

    return df[["text", "label"]]


# ─── Dataset loaders ─────────────────────────────────────────────────────────

def load_phishing_dataset():
    print(f"[INFO] Loading dataset from: {PHISHING_PATH}")
    df = pd.read_csv(PHISHING_PATH)

    for col in ["Email Text", "Email Type"]:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    df = df.dropna(subset=["Email Text", "Email Type"]).copy()
    df["text"]  = df["Email Text"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip()
    df["label"] = df["Email Type"].apply(map_label)

    return _finalise_dataset(df, "Phishing_Email")


def load_ceas_dataset():
    print(f"[INFO] Loading dataset from: {CEAS_PATH}")
    df = pd.read_csv(CEAS_PATH)
    df.columns = [c.strip() for c in df.columns]

    if "label" not in df.columns:
        raise ValueError("Missing required column: label")

    df["text"] = (
        _col_or_empty(df, "sender").str.strip()  + " " +
        _col_or_empty(df, "subject").str.strip() + " " +
        _col_or_empty(df, "body").str.strip()
    ).str.replace(r"\s+", " ", regex=True).str.strip()

    df["label"] = df["label"].apply(map_label)

    return _finalise_dataset(df, "CEAS_08")


@lru_cache(maxsize=1)
def load_combined_dataset():
    """Merges, deduplicates, and shuffles both datasets. Result is cached for the process lifetime."""
    df = pd.concat([load_phishing_dataset(), load_ceas_dataset()], ignore_index=True)
    df = df.drop_duplicates(subset=["text"]).copy()
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"[INFO] Combined dataset size: {len(df)}")
    print(f"[INFO] Combined safe emails: {(df['label'] == 0).sum()}")
    print(f"[INFO] Combined phishing emails: {(df['label'] == 1).sum()}")

    return df[["text", "label"]]


# ─── Training utilities ───────────────────────────────────────────────────────

def save_validation_split(X_val, y_val):
    """Writes the validation split to disk so evaluate_validation.py can reload it."""
    val_df = pd.DataFrame({
        "Email Text": X_val["text"].values,
        "Email Type": y_val.map({0: "Safe Email", 1: "Phishing Email"}).values,
    })
    val_df.to_csv(VALIDATION_SPLIT_PATH, index=False)
    print(f"[INFO] Saved validation split to: {VALIDATION_SPLIT_PATH}")


def split_dataset(df):
    """
    Splits df into train (70%), test (15%), and validation (15%).
    Logs sizes and saves the validation split to disk.
    Returns (X_train, X_test, X_val, y_train, y_test, y_val).
    """
    X = df[["text"]]
    y = df["label"]

    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42,
    )
    X_test, X_val, y_test, y_val = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42,
    )

    print(f"[INFO] Train size: {len(X_train)}")
    print(f"[INFO] Test size: {len(X_test)}")
    print(f"[INFO] Validation size: {len(X_val)}")

    save_validation_split(X_val, y_val)

    return X_train, X_test, X_val, y_train, y_test, y_val


# ─── Feature pipeline ─────────────────────────────────────────────────────────

def build_feature_pipeline():
    """Combines word-level and character-level TF-IDF into a single ColumnTransformer."""
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


# ─── Evaluation output ────────────────────────────────────────────────────────

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
