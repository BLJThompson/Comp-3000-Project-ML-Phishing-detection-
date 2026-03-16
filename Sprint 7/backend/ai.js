// backend/ai.js

const { spawn } = require("child_process");
const path = require("path");

function runPythonClassifier(email) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, "ml", "predict_email.py");

    const py = spawn("python", [script]);

    let data = "";
    let error = "";

    py.stdout.on("data", chunk => {
      data += chunk.toString();
    });

    py.stderr.on("data", chunk => {
      error += chunk.toString();
    });

    py.on("close", code => {
      if (code !== 0) {
        return reject(error);
      }

      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });

    py.stdin.write(JSON.stringify(email));
    py.stdin.end();
  });
}

/* --------------------------
   Suspicious pattern finder
---------------------------*/

function extractFindings(email) {
  const findings = [];

  const body = email.body || "";
  const subject = email.subject || "";

  function addMatches(text, field, regex, type, severity, reason) {
    for (const match of text.matchAll(regex)) {
      findings.push({
        field,
        type,
        severity,
        reason,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }

  addMatches(
    body,
    "body",
    /\b(urgent|immediately|within 24 hours|action required|suspended)\b/gi,
    "urgency",
    "medium",
    "Creates urgency to pressure the recipient."
  );

  addMatches(
    body,
    "body",
    /\b(verify your account|confirm password|login now|update account)\b/gi,
    "credential_request",
    "high",
    "Requests account credentials."
  );

  addMatches(
    subject,
    "subject",
    /\b(account suspended|security alert|password reset)\b/gi,
    "suspicious_subject",
    "medium",
    "Common phishing subject pattern."
  );

  const urlRegex = /https?:\/\/[^\s)]+/gi;
  const suspiciousHints = [
    "login",
    "verify",
    "secure",
    "update",
    "account",
    "bank",
    "paypal",
    "signin",
    "confirm",
    "password"
  ];

  for (const match of body.matchAll(urlRegex)) {
    const urlText = match[0].toLowerCase();

    const suspicious = suspiciousHints.some((hint) =>
      urlText.includes(hint)
    );

    if (suspicious) {
      findings.push({
        field: "body",
        type: "suspicious_link",
        severity: "high",
        reason: "Link contains keywords commonly used in phishing pages.",
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }

  return findings;
}

/* --------------------------
   Main classification
---------------------------*/

async function classifyEmailBasic(email) {
  const result = await runPythonClassifier(email);

  const aiLabel = result.label === 1 ? "phishing" : "benign";
  const aiScore = result.score;

  const findings = extractFindings(email);

  let aiExplanation;

  if (aiLabel === "phishing") {
    aiExplanation = `Local ML model flagged this email as phishing (score ${aiScore.toFixed(
      3
    )}).`;
  } else {
    aiExplanation = `Local ML model classified this email as benign (score ${aiScore.toFixed(
      3
    )}).`;
  }

  return {
    aiLabel,
    aiScore,
    aiModel: "logreg-ceas08-tfidf",
    aiExplanation,
    findings
  };
}

async function classifyEmailWithAI(email) {
  return classifyEmailBasic(email);
}

module.exports = {
  classifyEmailWithAI,
  extractFindings
};