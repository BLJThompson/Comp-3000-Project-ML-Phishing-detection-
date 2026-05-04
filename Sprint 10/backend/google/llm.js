// backend/google/llm.js

require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || "";

// client is null when no API key is set — callers receive null and fall back gracefully.
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MAX_BODY_LENGTH = 4000;
const MAX_FINDINGS    = 8;

//  Prompt utilities 

function safeString(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function truncateText(text, maxLength = MAX_BODY_LENGTH) {
  const value = safeString(text).trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}\n\n[truncated]`;
}

// Maps a numeric score to a plain-language confidence band for the prompt.
function getConfidenceBand(aiScore) {
  if (typeof aiScore !== "number" || !Number.isFinite(aiScore)) return "unknown";
  if (aiScore >= 0.9) return "high";
  if (aiScore >= 0.7) return "medium";
  return "low";
}

// Formats the findings array into a numbered list for the prompt.
function formatFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return "No structured findings were extracted.";
  }

  return findings
    .slice(0, MAX_FINDINGS)
    .map((f, i) => {
      const text = safeString(f.text);
      return `${i + 1}. type=${safeString(f.type)}; severity=${safeString(f.severity)}; reason=${safeString(f.reason)}${text ? `; text=${text}` : ""}`;
    })
    .join("\n");
}

// Builds the prompt sent to Gemini.
function buildPrompt({ sender, subject, body, aiLabel, aiScore, findings }) {
  const cleanScore =
    typeof aiScore === "number" && Number.isFinite(aiScore)
      ? aiScore.toFixed(3)
      : "unknown";

  return `
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
Sender: ${safeString(sender) || "[empty]"}
Subject: ${safeString(subject) || "[empty]"}
Body:
${truncateText(body) || "[empty]"}

System result:
Label: ${safeString(aiLabel)}
Confidence band: ${getConfidenceBand(aiScore)}

Detected findings:
${formatFindings(findings)}

Return only the Summary and Explanation lines.
`.trim();
}

//  Public API 

// Calls Gemini to generate a user-facing summary and explanation for a phishing email.
// Returns null if the client is not configured or if the API call fails.
async function explainPhishingEmail({ sender, subject, body, aiLabel, aiScore, findings }) {
  if (!client) return null;

  const prompt = buildPrompt({ sender, subject, body, aiLabel, aiScore, findings });

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response?.text?.trim() || null;
  } catch (err) {
    console.error("Gemini explanation error:", err?.message || err);
    return null;
  }
}

module.exports = { explainPhishingEmail };
