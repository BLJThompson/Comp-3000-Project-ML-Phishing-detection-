// backend/ai.js
//
// Local ML-powered email classifier that calls the Python model
// in backend/ml/predict_email.py via child_process.
//
// It returns:
//   {
//     aiLabel: "phishing" | "benign",
//     aiScore: number in [0, 1],   // probability of phishing
//     aiModel: "logreg-ceas08-tfidf",
//     aiExplanation: string
//   }

const { spawn } = require("child_process");
const path = require("path");

// On your machine, the venv is backend/.venv, and you used:
//   .\.venv\Scripts\python.exe .\ml\train_ceas_model.py
// So we use the same interpreter here:
const PYTHON_BIN = path.join(__dirname, ".venv", "Scripts", "python.exe");
// If that ever fails, you could change this to "python" or "py".

const PREDICT_SCRIPT = path.join(__dirname, "ml", "predict_email.py");

/**
 * Low-level: run the Python classifier for one email.
 * @param {{sender: string, subject: string, body: string}} email
 * @returns {Promise<{label: number, score: number}>}
 */
function runPythonClassifier(email) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_BIN, [PREDICT_SCRIPT]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("error", (err) => {
      console.error("Failed to start Python classifier:", err);
      reject(err);
    });

    py.on("close", (code) => {
      if (code !== 0) {
        console.error(
          "Python classifier exited with code",
          code,
          "stderr:",
          stderr
        );
        return reject(new Error("Python classifier error"));
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        if (typeof parsed.label !== "number" || typeof parsed.score !== "number") {
          throw new Error("Invalid classifier JSON shape");
        }
        resolve(parsed);
      } catch (e) {
        console.error("Failed to parse classifier JSON:", stdout);
        reject(e);
      }
    });

    const payload = {
      sender: email.sender || "",
      subject: email.subject || "",
      body: email.body || "",
    };

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
}

/**
 * Main classifier used by the rest of the backend.
 * Wraps the Python result in the format your API expects.
 */
async function classifyEmailBasic(email) {
  const result = await runPythonClassifier(email);

  const aiLabel = result.label === 1 ? "phishing" : "benign";
  let aiScore = typeof result.score === "number" ? result.score : 0.5;

  // Clamp just in case
  if (!Number.isFinite(aiScore)) aiScore = 0.5;
  if (aiScore < 0) aiScore = 0;
  if (aiScore > 1) aiScore = 1;

  let aiExplanation;
  if (aiLabel === "phishing") {
    aiExplanation = `Local ML model: looks like phishing (score ${aiScore.toFixed(
      3
    )}).`;
  } else {
    aiExplanation = `Local ML model: looks benign (score ${aiScore.toFixed(
      3
    )}).`;
  }

  return {
    aiLabel,
    aiScore,
    aiModel: "logreg-ceas08-tfidf",
    aiExplanation,
  };
}

// Backwards-compatible names used by server.js
async function classifyEmailWithAI(email) {
  return classifyEmailBasic(email);
}

async function classifyEmailHeuristic(email) {
  return classifyEmailBasic(email);
}

module.exports = {
  classifyEmailWithAI,
  classifyEmailBasic,
  classifyEmailHeuristic,
};
