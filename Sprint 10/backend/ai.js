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

function buildLocalSummary(email) {
  const body = safeString(email.body).replace(/\s+/g, " ").trim();
  const subject = safeString(email.subject).trim();
  const lowerBody = body.toLowerCase();

  if (
    lowerBody.includes("unusual activity") &&
    (lowerBody.includes("verify") || lowerBody.includes("confirm")) &&
    lowerBody.includes("account")
  ) {
    return "The email claims there has been unusual account activity and asks the recipient to confirm or verify account details using a link.";
  }

  if (
    lowerBody.includes("tax refund") ||
    lowerBody.includes("refund") ||
    lowerBody.includes("hmrc")
  ) {
    return "The email claims the recipient may be owed a refund and asks them to follow instructions to claim or verify details.";
  }

  if (
    lowerBody.includes("invoice") ||
    lowerBody.includes("payment") ||
    lowerBody.includes("bank details")
  ) {
    return "The email discusses a payment or invoice and asks the recipient to review or act on financial details.";
  }

  if (
    lowerBody.includes("password") ||
    lowerBody.includes("login") ||
    lowerBody.includes("sign in") ||
    lowerBody.includes("security")
  ) {
    return "The email relates to account security or sign-in activity and asks the recipient to take action.";
  }

  const sentences = body
    .replace(/https?:\/\/\S+/gi, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    return `${sentences[0]} ${sentences[1]}`;
  }

  if (sentences.length === 1) {
    return sentences[0];
  }

  if (subject) {
    return `The email appears to relate to: ${subject}.`;
  }

  return "This email has limited visible content to summarise.";
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