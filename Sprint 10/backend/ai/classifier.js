// backend/ai/classifier.js

const { spawn } = require("child_process");
const path = require("path");
const { explainPhishingEmail } = require("../google/llm");
const { safeString, extractFindings, buildExplanation } = require("./findingRules");

const PYTHON_SCRIPT = path.join(__dirname, "..", "ml", "predict_email.py");
const PYTHON_CMD =
  process.platform === "win32"
    ? path.join(__dirname, "..", ".venv", "Scripts", "python.exe")
    : path.join(__dirname, "..", ".venv", "bin", "python");

// Used in both buildLocalClassification and buildFallbackClassification.
const BENIGN_EXPLANATION =
  "This email appears safe with no significant phishing indicators detected.";

// Clamps a score to [0, 1], returning 0.5 for invalid values.
function normalizeScore(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0.5;
  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}

// Truncates a string for use in error messages.
function truncateText(text, max = 240) {
  const s = safeString(text).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}...`;
}

// Spawns the Python ML classifier and returns the parsed result.
function runPythonClassifier(email) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON_CMD, [PYTHON_SCRIPT]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    py.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    py.on("error", (err) => {
      reject(new Error(`Failed to start Python classifier: ${err.message}`));
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Python classifier exited with code ${code}`));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(
          `Failed to parse Python classifier JSON. Output was: ${truncateText(stdout, 500)}`
        ));
      }
    });

    py.stdin.write(JSON.stringify({
      sender: safeString(email.sender),
      subject: safeString(email.subject),
      body: safeString(email.body),
    }));
    py.stdin.end();
  });
}

// Normalises the Python classifier output into a consistent label/score/model shape.
function mapClassifierResult(result) {
  const aiLabel =
    result.label === 1 || result.labelText === "Phishing" ? "phishing" : "benign";

  let rawScore = null;

  if (typeof result.phishingScore === "number") {
    rawScore = result.phishingScore;
  } else if (typeof result.confidence === "number") {
    rawScore = aiLabel === "phishing" ? result.confidence : 1 - result.confidence;
  } else if (typeof result.score === "number") {
    rawScore = result.score;
  }

  return {
    aiLabel,
    aiScore: normalizeScore(rawScore),
    aiModel: result.model || "phish_model_svm_combined_cv.joblib",
  };
}

// Runs the ML classifier and upgrades the explanation with Gemini for phishing emails.
async function buildLocalClassification(email) {
  const result = await runPythonClassifier(email);
  const { aiLabel, aiScore, aiModel } = mapClassifierResult(result);
  const findings = extractFindings(email);

  let aiExplanation =
    aiLabel === "phishing" ? buildExplanation(aiLabel, aiScore, findings) : BENIGN_EXPLANATION;
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

  return { aiLabel, aiScore, aiModel, aiExplanation, explanationSource, findings };
}

// Rule-based fallback used when the Python classifier is unavailable.
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
    aiExplanation: aiLabel === "phishing"
      ? buildExplanation(aiLabel, aiScore, findings)
      : BENIGN_EXPLANATION,
    explanationSource: "fallback",
    findings,
  };
}

// Classifies an email, falling back to rule-based scoring if the ML model fails.
async function classifyEmailWithAI(email) {
  try {
    return await buildLocalClassification(email);
  } catch (err) {
    console.error("Error classifying email with ML:", err.message || err);
    return buildFallbackClassification(email);
  }
}

module.exports = { classifyEmailWithAI };
