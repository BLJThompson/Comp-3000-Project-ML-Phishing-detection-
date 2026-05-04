# backend/ml/train_svm_combined_cv.py

import os
import joblib

from sklearn.model_selection import StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from ml.utils import load_combined_dataset, build_feature_pipeline, print_results, split_dataset

THIS_DIR   = os.path.dirname(__file__)
MODEL_PATH = os.path.join(THIS_DIR, "phish_model_svm_combined_cv.joblib")


def main():
    df = load_combined_dataset()
    X_train, X_test, _, y_train, y_test, _ = split_dataset(df)

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

    print(f"[INFO] Best params: {search.best_params_}")
    print(f"[INFO] Best CV F1:  {search.best_score_:.4f}")

    best_model = search.best_estimator_
    print_results("SVM", y_test, best_model.predict(X_test))

    joblib.dump(best_model, MODEL_PATH)
    print(f"[INFO] Saved: {MODEL_PATH}")


if __name__ == "__main__":
    main()
