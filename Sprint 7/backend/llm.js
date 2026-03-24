require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function explainPhishingEmail({
  sender,
  subject,
  body,
  aiLabel,
  aiScore,
  findings,
}) {
  if (!process.env.GEMINI_API_KEY) return null;

  const findingSummary =
    Array.isArray(findings) && findings.length
      ? findings
          .map((f) => `- ${f.type}: ${f.reason}${f.text ? ` | text: ${f.text}` : ""}`)
          .join("\n")
      : "No structured findings were extracted.";

  const prompt = `
You are explaining a phishing detection result to a normal non-technical user.

Rules:
- Write 2 to 4 short sentences.
- Use simple language.
- Do not mention machine learning, model internals, or probabilities.
- Do not invent evidence.
- If the result is uncertain, say so clearly.

Sender: ${sender}
Subject: ${subject}
Body:
${body}

System label: ${aiLabel}
System score: ${aiScore}

Detected findings:
${findingSummary}
`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text?.trim() || null;
}

module.exports = { explainPhishingEmail };