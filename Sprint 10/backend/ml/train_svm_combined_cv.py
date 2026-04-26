import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from ml.utils import load_combined_dataset, build_feature_pipeline, print_results

THIS_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(THIS_DIR, "phish_model_svm_combined_cv.joblib")
VALIDATION_SPLIT_PATH = os.path.join(THIS_DIR, "..", "data", "validation_split_combined.csv")


def save_validation_split(X_val, y_val):
    val_df = pd.DataFrame({
        "Email Text": X_val["text"].values,
        "Email Type": y_val.map({0: "Safe Email", 1: "Phishing Email"}).values,
    })
    val_df.to_csv(VALIDATION_SPLIT_PATH, index=False)
    print(f"[INFO] Saved validation split to: {VALIDATION_SPLIT_PATH}")


def main():
    df = load_combined_dataset()

    X = df[["text"]]
    y = df["label"]

    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=0.30,
        stratify=y,
        random_state=42,
    )

    X_test, X_val, y_test, y_val = train_test_split(
        X_temp,
        y_temp,
        test_size=0.50,
        stratify=y_temp,
        random_state=42,
    )

    print(f"[INFO] Train size: {len(X_train)}")
    print(f"[INFO] Test size: {len(X_test)}")
    print(f"[INFO] Validation size: {len(X_val)}")

    save_validation_split(X_val, y_val)

    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    pipeline = Pipeline([
        ("features", build_feature_pipeline()),
        ("clf", LinearSVC(class_weight="balanced")),
    ])

    search = GridSearchCV(
        estimator=pipeline,
        param_grid={"clf__C": [1.0, 2.0]},
        scoring="f1",
        cv=cv,
        n_jobs=-1,
        verbose=1,
    )

    print("\n[INFO] Training SVM...")
    search.fit(X_train, y_train)

    print(f"[INFO] SVM best params: {search.best_params_}")
    print(f"[INFO] SVM best CV F1: {search.best_score_:.4f}")

    best_model = search.best_estimator_
    y_pred = best_model.predict(X_test)

    print_results("SVM", y_test, y_pred)

    joblib.dump(best_model, MODEL_PATH)
    print(f"[INFO] Saved: {MODEL_PATH}")


if __name__ == "__main__":
    main()