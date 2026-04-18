// backend/ai.js

const { spawn } = require("child_process");
const path = require("path");
const { explainPhishingEmail } = require("./llm");
const {
  safeString,
  extractFindings,
  buildExplanation,
} = require("./ai_rules");

const PYTHON_SCRIPT = path.join(__dirname, "ml", "predict_email.py");
const PYTHON_CMD =
  process.platform === "win32"
    ? path.join(__dirname, ".venv", "Scripts", "python.exe")
    : path.join(__dirname, ".venv", "bin", "python");

function normalizeScore(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0.5;
  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}

function truncateText(text, max = 240) {
  const s = safeString(text).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}...`;
}

function runPythonClassifier(email) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_CMD, [PYTHON_SCRIPT]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    py.on("error", (err) => {
      reject(new Error(`Failed to start Python classifier: ${err.message}`));
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(stderr || `Python classifier exited with code ${code}`)
        );
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(
          new Error(
            `Failed to parse Python classifier JSON. Output was: ${truncateText(stdout, 500)}`
          )
        );
      }
    });

    py.stdin.write(
      JSON.stringify({
        sender: safeString(email.sender),
        subject: safeString(email.subject),
        body: safeString(email.body),
      })
    );
    py.stdin.end();
  });
}

function mapClassifierResult(result) {
  const aiLabel =
    result.label === 1 || result.labelText === "Phishing"
      ? "phishing"
      : "benign";

  let rawScore = null;

  if (typeof result.phishingScore === "number") {
    rawScore = result.phishingScore;
  } else if (typeof result.confidence === "number") {
    rawScore = aiLabel === "phishing" ? result.confidence : 1 - result.confidence;
  } else if (typeof result.score === "number") {
    rawScore = result.score;
  }

  const aiScore = normalizeScore(rawScore);
  const aiModel = result.model || "phish_model_svm_combined_cv.joblib";

  return {
    aiLabel,
    aiScore,
    aiModel,
  };
}

async function buildLocalClassification(email) {
  const result = await runPythonClassifier(email);
  const { aiLabel, aiScore, aiModel } = mapClassifierResult(result);
  const findings = extractFindings(email);

  let aiExplanation =
    aiLabel === "phishing"
      ? buildExplanation(aiLabel, aiScore, findings)
      : "This email appears safe with no significant phishing indicators detected.";

  let explanationSource = "local";

  if (aiLabel === "phishing") {
    try {
      const llmExplanation = await explainPhishingEmail({
        sender: safeString(email.sender),
        subject: safeString(email.subject),
        body: safeString(email.body),
        aiLabel,
        aiScore,
        findings,
      });

      if (llmExplanation) {
        aiExplanation = llmExplanation;
        explanationSource = "gemini";
      }
    } catch (err) {
      console.error("Gemini explanation failed:", err.message || err);
    }
  }

  return {
    aiLabel,
    aiScore,
    aiModel,
    aiExplanation,
    explanationSource,
    findings,
  };
}

function buildFallbackClassification(email) {
  const findings = extractFindings(email);

  const hasHigh = findings.some((f) => f.severity === "high");
  const hasMedium = findings.some((f) => f.severity === "medium");

  const aiLabel = hasHigh ? "phishing" : "benign";
  const aiScore = hasHigh ? 0.7 : hasMedium ? 0.55 : 0.3;

  return {
    aiLabel,
    aiScore,
    aiModel: "fallback-rules",
    aiExplanation:
      aiLabel === "phishing"
        ? buildExplanation(aiLabel, aiScore, findings)
        : "This email appears safe with no significant phishing indicators detected.",
    explanationSource: "fallback",
    findings,
  };
}

async function classifyEmailWithAI(email) {
  try {
    return await buildLocalClassification(email);
  } catch (err) {
    console.error("Error classifying email with ML:", err.message || err);
    return buildFallbackClassification(email);
  }
}

module.exports = {
  classifyEmailWithAI,
};