import os
import sys
import joblib
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

from ml.utils import TextCleaner, map_label  # noqa: F401

THIS_DIR = os.path.dirname(__file__)
DEFAULT_VALIDATION_PATH = os.path.join(THIS_DIR, "..", "data", "validation_split_combined.csv")

MODEL_MAP = {
    "svm": os.path.join(THIS_DIR, "phish_model_svm_combined_cv.joblib"),
    "logreg": os.path.join(THIS_DIR, "phish_model_logreg_combined_cv.joblib"),
    "rf": os.path.join(THIS_DIR, "phish_model_rf_combined_cv.joblib"),
}


def find_text_column(df):
    for col in ["Email Text", "email_text", "text", "body", "message", "content"]:
        if col in df.columns:
            return col
    raise ValueError(f"No text column found. Columns: {list(df.columns)}")


def find_label_column(df):
    for col in ["Email Type", "email_type", "label", "Label", "type", "class"]:
        if col in df.columns:
            return col
    raise ValueError(f"No label column found. Columns: {list(df.columns)}")


def load_validation_data(path):
    print(f"[INFO] Loading validation dataset from: {path}")
    df = pd.read_csv(path)

    text_col = find_text_column(df)
    label_col = find_label_column(df)

    X_val = df[text_col].fillna("").astype(str).str.strip().to_frame(name="text")
    y_val = df[label_col].apply(map_label)

    if y_val.isnull().any():
        bad_values = df.loc[y_val.isnull(), label_col].unique()
        raise ValueError(f"Unexpected label values found: {bad_values}")

    mask = X_val["text"] != ""
    X_val = X_val[mask]
    y_val = y_val[mask].astype(int)

    return X_val, y_val, text_col, label_col


def evaluate_one(model_path, validation_path):
    print(f"\n[INFO] Loading model from: {model_path}")
    model = joblib.load(model_path)

    X_val, y_val, text_col, label_col = load_validation_data(validation_path)

    print(f"[INFO] Text column used: {text_col}")
    print(f"[INFO] Label column used: {label_col}")
    print(f"[INFO] Validation samples: {len(X_val)}")
    print(f"[INFO] Safe emails: {(y_val == 0).sum()}")
    print(f"[INFO] Phishing emails: {(y_val == 1).sum()}")

    y_pred = model.predict(X_val)

    print("=== Validation Scores ===")
    print(f"Accuracy : {accuracy_score(y_val, y_pred):.4f}")
    print(f"Precision: {precision_score(y_val, y_pred, zero_division=0):.4f}")
    print(f"Recall   : {recall_score(y_val, y_pred, zero_division=0):.4f}")
    print(f"F1-score : {f1_score(y_val, y_pred, zero_division=0):.4f}")

    print("\n=== Confusion Matrix ===")
    print(confusion_matrix(y_val, y_pred))

    print("\n=== Classification Report ===")
    print(classification_report(y_val, y_pred, digits=4, zero_division=0))


def main():
    validation_path = DEFAULT_VALIDATION_PATH

    if len(sys.argv) >= 2 and sys.argv[1] == "all":
        if len(sys.argv) >= 3:
            validation_path = sys.argv[2]

        for name, model_path in MODEL_MAP.items():
            print(f"\n================ {name.upper()} ================")
            evaluate_one(model_path, validation_path)
        return

    model_path = MODEL_MAP["svm"]

    if len(sys.argv) >= 2:
        arg = sys.argv[1]
        model_path = MODEL_MAP.get(arg, arg)

    if len(sys.argv) >= 3:
        validation_path = sys.argv[2]

    evaluate_one(model_path, validation_path)


if __name__ == "__main__":
    main()