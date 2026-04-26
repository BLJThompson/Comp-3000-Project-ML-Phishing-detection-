import subprocess
import sys

MODEL_MODULES = {
    "svm": "ml.train_svm_combined_cv",
    "logreg": "ml.train_logreg_combined_cv",
    "rf": "ml.train_rf_combined_cv",
}


def run_module(module_name):
    print(f"\n================ RUNNING {module_name} ================\n")
    result = subprocess.run([sys.executable, "-m", module_name])
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main():
    if len(sys.argv) >= 2:
        selected = sys.argv[1].lower()
        if selected not in MODEL_MODULES:
            raise ValueError(f"Invalid model: {selected}. Choose from {set(MODEL_MODULES.keys())}")
        run_module(MODEL_MODULES[selected])
        return

    for module_name in MODEL_MODULES.values():
        run_module(module_name)

    print("\n[INFO] All requested model training completed.")


if __name__ == "__main__":
    main()