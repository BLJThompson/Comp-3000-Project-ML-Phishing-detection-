require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || "";

const client = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

function safeString(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function truncateText(text, maxLength = 4000) {
  const value = safeString(text).trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}\n\n[truncated]`;
}

function formatFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return "No structured findings were extracted.";
  }

  return findings
    .slice(0, 8)
    .map((f, index) => {
      const type = safeString(f.type);
      const severity = safeString(f.severity);
      const reason = safeString(f.reason);
      const text = safeString(f.text);

      return `${index + 1}. type=${type}; severity=${severity}; reason=${reason}${
        text ? `; text=${text}` : ""
      }`;
    })
    .join("\n");
}

function getConfidenceBand(aiScore) {
  if (typeof aiScore !== "number" || !Number.isFinite(aiScore)) {
    return "unknown";
  }
  if (aiScore >= 0.9) return "high";
  if (aiScore >= 0.7) return "medium";
  return "low";
}

async function explainPhishingEmail({
  sender,
  subject,
  body,
  aiLabel,
  aiScore,
  findings,
}) {
  if (!client) {
    return null;
  }

  const cleanSender = safeString(sender);
  const cleanSubject = safeString(subject);
  const cleanBody = truncateText(body, 4000);
  const cleanLabel = safeString(aiLabel);
  const cleanScore =
    typeof aiScore === "number" && Number.isFinite(aiScore)
      ? aiScore.toFixed(3)
      : "unknown";
  const confidenceBand = getConfidenceBand(aiScore);
  const findingSummary = formatFindings(findings);

  const prompt = `
You are explaining an email safety result to a normal non-technical user.

Write a short email summary and then a short safety explanation for the email below.

Rules:
- Use this exact two-line structure:
  Summary: one short sentence describing what the email is asking or saying.
  Explanation: 2 to 3 short sentences explaining the safety result.
- Use simple, calm language.
- Do not mention machine learning, model internals, probabilities, thresholds, or scores.
- Do not invent evidence.
- Only mention evidence that appears in the email details or findings.
- If confidence is low or medium, avoid sounding certain.
- If the email appears phishing, recommend caution without exaggeration.
- If the email appears benign, say it appears safe unless there are meaningful warning signs.

Email details:
Sender: ${cleanSender || "[empty]"}
Subject: ${cleanSubject || "[empty]"}
Body:
${cleanBody || "[empty]"}

System result:
Label: ${cleanLabel}
Confidence band: ${confidenceBand}

Detected findings:
${findingSummary}

Return only the Summary and Explanation lines.
`.trim();

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response?.text?.trim();
    return text || null;
  } catch (error) {
    console.error("Gemini explanation error:", error?.message || error);
    return null;
  }
}

module.exports = { explainPhishingEmail };