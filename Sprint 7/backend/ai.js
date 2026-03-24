// backend/ai.js

const { spawn } = require("child_process");
const path = require("path");
const { explainPhishingEmail } = require("./llm");

function normalizeScore(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0.5;
  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}

function runPythonClassifier(email) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, "ml", "predict_email.py");

    const pythonCmd =
      process.platform === "win32"
        ? path.join(__dirname, ".venv", "Scripts", "python.exe")
        : path.join(__dirname, ".venv", "bin", "python");

    const py = spawn(pythonCmd, [script]);

    let data = "";
    let error = "";

    py.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      error += chunk.toString();
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(error || `Python classifier exited with code ${code}`);
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

function extractEmailAddress(sender = "") {
  const angleMatch = sender.match(/<([^>]+)>/);
  if (angleMatch) return angleMatch[1].trim().toLowerCase();

  const plainEmailMatch = sender.match(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  );
  if (plainEmailMatch) return plainEmailMatch[0].trim().toLowerCase();

  return "";
}

function extractDisplayName(sender = "") {
  const angleMatch = sender.match(/^(.+?)\s*<[^>]+>$/);
  if (angleMatch) return angleMatch[1].trim();
  return sender.trim();
}

function extractDomain(emailAddress = "") {
  const at = emailAddress.lastIndexOf("@");
  if (at === -1) return "";
  return emailAddress.slice(at + 1).toLowerCase();
}

function makeFinding({ field, type, severity, reason, text, start, end }) {
  return {
    field,
    type,
    severity,
    reason,
    text,
    start,
    end,
  };
}

function addSenderEmailFinding(findings, sender, emailAddress, type, severity, reason) {
  const senderText = sender || "";
  const highlightedText = emailAddress || senderText;

  let start = 0;
  let end = senderText.length;

  if (emailAddress) {
    const emailIndex = senderText
      .toLowerCase()
      .indexOf(emailAddress.toLowerCase());

    if (emailIndex !== -1) {
      start = emailIndex;
      end = emailIndex + emailAddress.length;
    }
  }

  findings.push(
    makeFinding({
      field: "sender",
      type,
      severity,
      reason,
      text: highlightedText,
      start,
      end,
    })
  );
}

function extractFindings(email) {
  const findings = [];

  const sender = email.sender || "";
  const subject = email.subject || "";
  const body = email.body || "";

  function addMatches(text, field, regex, type, severity, reason) {
    for (const match of text.matchAll(regex)) {
      findings.push(
        makeFinding({
          field,
          type,
          severity,
          reason,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        })
      );
    }
  }

  // Subject lures
  addMatches(
    subject,
    "subject",
    /\b(account suspended|security alert|password reset|unusual activity|verify now|urgent action required|final warning)\b/gi,
    "suspicious_subject",
    "high",
    "Subject resembles a common phishing lure."
  );

  addMatches(
    subject,
    "subject",
    /\b(congratulations|you are a winner|claim now|limited offer|special promotion)\b/gi,
    "scam_subject",
    "medium",
    "Subject uses promotional or scam-style bait language."
  );

  addMatches(
    subject,
    "subject",
    /\b(daily top 10|newsletter|news alert|account notice|important update)\b/gi,
    "bulk_mail_subject",
    "low",
    "Subject resembles a bulk-email or newsletter pattern."
  );

  addMatches(
    subject,
    "subject",
    /\b(bonus|grant|reward|special bonus|exclusive bonus|free bonus)\b/gi,
    "reward_bait",
    "medium",
    "Uses reward or bonus language often seen in scam emails."
  );

  addMatches(
    subject,
    "subject",
    /\b(fw:|fwd:)\b/gi,
    "forwarded_bait",
    "low",
    "Uses a forwarded-style subject which can be used in spam bait."
  );

  addMatches(
    subject,
    "subject",
    /!{2,}/g,
    "hype_punctuation",
    "low",
    "Uses excessive punctuation common in spam or scam messages."
  );

  // Body patterns
  addMatches(
    body,
    "body",
    /\b(urgent|immediately|as soon as possible|within 24 hours|within 48 hours|final warning|act now|action required|suspended|locked|expires today|respond now)\b/gi,
    "urgency",
    "medium",
    "Creates urgency to pressure the recipient."
  );

  addMatches(
    body,
    "body",
    /\b(verify your account|confirm your account|confirm password|verify your password|login now|sign in now|update your account|reset your password|confirm your identity|validate your account|re-enter your password)\b/gi,
    "credential_request",
    "high",
    "Requests account credentials or account verification."
  );

  addMatches(
    body,
    "body",
    /\b(account will be locked|account has been suspended|service will be suspended|your access will be removed|failure to respond|unauthorised activity detected|unauthorized activity detected)\b/gi,
    "threat_language",
    "high",
    "Uses threats or consequences to pressure action."
  );

  addMatches(
    body,
    "body",
    /\b(payment required|bank account|transfer funds|wire transfer|invoice attached|outstanding balance|confirm your payment|billing issue|refund available|payment failed)\b/gi,
    "financial_request",
    "high",
    "References money, banking, or payment pressure."
  );

  addMatches(
    body,
    "body",
    /\b(congratulations|winner|claim your prize|claim now|you have been selected|lottery|jackpot|free gift|exclusive offer|limited offer)\b/gi,
    "prize_scam",
    "medium",
    "Uses prize or reward language common in scam emails."
  );

  addMatches(
    body,
    "body",
    /\b(bonus|grant|reward|special bonus|exclusive bonus|free bonus|feel well)\b/gi,
    "reward_bait",
    "medium",
    "Uses reward or bonus language often seen in scam emails."
  );

  addMatches(
    body,
    "body",
    /\b(receive our|get our|claim our|take our)\b/gi,
    "promotional_bait",
    "medium",
    "Uses promotional bait phrasing common in spam or scam messages."
  );

  addMatches(
    body,
    "body",
    /\b(cheap|discount|buy now|order now|limited time|special offer|replica|online store|luxury watches|rolex|pharmacy|medications|drugs|enhancement|male enhancement)\b/gi,
    "spam_offer",
    "medium",
    "Contains commercial spam or scam-style offer language."
  );

  addMatches(
    body,
    "body",
    /\b(provide your details|send your password|confirm your login|submit your credentials|enter your card details|confirm your bank details)\b/gi,
    "sensitive_info_request",
    "high",
    "Requests sensitive personal or account information."
  );

  addMatches(
    body,
    "body",
    /\b(unsubscribe|manage your settings|privacy policy|all rights reserved)\b/gi,
    "bulk_mail_marker",
    "low",
    "Contains bulk-mail or newsletter footer language."
  );

  const knownBrands = [
    { name: "cnn", domains: ["cnn.com"] },
    { name: "paypal", domains: ["paypal.com"] },
    { name: "microsoft", domains: ["microsoft.com", "outlook.com", "live.com"] },
    { name: "apple", domains: ["apple.com", "icloud.com"] },
    { name: "amazon", domains: ["amazon.com", "amazon.co.uk"] },
    { name: "netflix", domains: ["netflix.com"] },
    { name: "hmrc", domains: ["hmrc.gov.uk"] },
    { name: "royal mail", domains: ["royalmail.com"] },
    { name: "dhl", domains: ["dhl.com"] },
    { name: "visa", domains: ["visa.com"] },
    { name: "mastercard", domains: ["mastercard.com"] },
    { name: "bank", domains: [] },
  ];

  for (const brand of knownBrands) {
    const brandRegex = new RegExp(`\\b${brand.name.replace(/\s+/g, "\\s+")}\\b`, "gi");

    for (const match of body.matchAll(brandRegex)) {
      findings.push(
        makeFinding({
          field: "body",
          type: "brand_reference",
          severity: "low",
          reason:
            "Mentions a trusted brand or service often used in impersonation attempts.",
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        })
      );
    }

    for (const match of subject.matchAll(brandRegex)) {
      findings.push(
        makeFinding({
          field: "subject",
          type: "brand_reference",
          severity: "low",
          reason:
            "Mentions a trusted brand or service often used in impersonation attempts.",
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        })
      );
    }
  }

  // URL checks
  const urlRegex = /https?:\/\/[^\s)>\]]+/gi;
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
    "password",
    "billing",
    "refund",
    "unlock",
    "security",
  ];

  const suspiciousDomains = [
    "bit.ly",
    "tinyurl",
    "goo.gl",
    "t.co",
    "ow.ly",
    "buff.ly",
  ];

  for (const match of body.matchAll(urlRegex)) {
    const urlText = match[0];
    const lower = urlText.toLowerCase();

    const hasSuspiciousKeyword = suspiciousHints.some((hint) =>
      lower.includes(hint)
    );
    const hasShortener = suspiciousDomains.some((domain) =>
      lower.includes(domain)
    );

    if (hasSuspiciousKeyword || hasShortener) {
      findings.push(
        makeFinding({
          field: "body",
          type: "suspicious_link",
          severity: "high",
          reason: hasShortener
            ? "Uses a shortened or obscured link."
            : "Link contains keywords commonly associated with phishing pages.",
          text: urlText,
          start: match.index,
          end: match.index + urlText.length,
        })
      );
    }
  }

  // Sender checks
  const emailAddress = extractEmailAddress(sender);
  const senderDomain = extractDomain(emailAddress);
  const displayName = extractDisplayName(sender).toLowerCase();

  if (emailAddress) {
    for (const brand of knownBrands) {
      const displayContainsBrand = displayName.includes(brand.name);
      const subjectContainsBrand = subject.toLowerCase().includes(brand.name);
      const bodyContainsBrand = body.toLowerCase().includes(brand.name);

      const referencesBrand =
        displayContainsBrand || subjectContainsBrand || bodyContainsBrand;

      const domainMatchesBrand =
        brand.domains.length === 0 ||
        brand.domains.some(
          (expected) =>
            senderDomain === expected || senderDomain.endsWith(`.${expected}`)
        );

      if (referencesBrand && !domainMatchesBrand) {
        addSenderEmailFinding(
          findings,
          sender,
          emailAddress,
          "sender_mismatch",
          "high",
          `Message references ${brand.name}, but the sender domain does not match the expected brand domain.`
        );
      }
    }

    const suspiciousSenderPatterns = [
      /@.*\.ru$/i,
      /@.*\.cn$/i,
      /@.*\.tk$/i,
      /@.*\.top$/i,
      /@.*\.xyz$/i,
    ];

    if (suspiciousSenderPatterns.some((pattern) => pattern.test(emailAddress))) {
      addSenderEmailFinding(
        findings,
        sender,
        emailAddress,
        "suspicious_sender_domain",
        "medium",
        "Sender uses a domain pattern commonly associated with suspicious email traffic."
      );
    }
  }

  return dedupeFindings(findings);
}

function dedupeFindings(findings) {
  const seen = new Set();
  const severityWeight = { high: 3, medium: 2, low: 1 };

  const sorted = [...findings].sort((a, b) => {
    if (a.field !== b.field) return a.field.localeCompare(b.field);
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return a.end - b.end;
    return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
  });

  const result = [];

  for (const finding of sorted) {
    const key = `${finding.field}:${finding.start}:${finding.end}:${finding.type}:${finding.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(finding);
  }

  return result;
}

function buildExplanation(aiLabel, aiScore, findings) {
  if (aiLabel !== "phishing") {
    return `Local ML model classified this email as benign (score ${aiScore.toFixed(
      3
    )}).`;
  }

  if (!findings.length) {
    return `Local ML model flagged this email as phishing (score ${aiScore.toFixed(
      3
    )}).`;
  }

  const readable = {
    urgency: "urgency language",
    credential_request: "credential requests",
    suspicious_link: "suspicious links",
    suspicious_subject: "suspicious subject wording",
    financial_request: "financial pressure",
    threat_language: "threat language",
    prize_scam: "prize scam language",
    reward_bait: "reward or bonus bait",
    promotional_bait: "promotional bait language",
    spam_offer: "spam-style offer language",
    brand_reference: "trusted brand references",
    scam_subject: "scam-style subject bait",
    sensitive_info_request: "requests for sensitive information",
    sender_mismatch: "sender/domain mismatch",
    suspicious_sender_domain: "suspicious sender domain",
    bulk_mail_marker: "bulk-mail markers",
    bulk_mail_subject: "newsletter-style subject",
    forwarded_bait: "forwarded-style subject bait",
    hype_punctuation: "excessive punctuation",
  };

  const summary = [...new Set(findings.map((f) => readable[f.type] || f.type))]
    .slice(0, 3)
    .join(", ");

  return `Local ML model flagged this email as phishing (score ${aiScore.toFixed(
    3
  )}) due to ${summary}.`;
}

async function classifyEmailBasic(email) {
  const result = await runPythonClassifier(email);

  const aiLabel = result.label === 1 ? "phishing" : "benign";
  const aiScore = normalizeScore(result.score);
  const findings = extractFindings(email);

  let aiExplanation =
    aiLabel === "phishing"
      ? buildExplanation(aiLabel, aiScore, findings)
      : "This email appears safe with no significant phishing indicators detected.";

  let explanationSource = "local";

  // Only use Gemini for phishing emails
  if (aiLabel === "phishing") {
    try {
      const llmExplanation = await explainPhishingEmail({
        sender: email.sender || "",
        subject: email.subject || "",
        body: email.body || "",
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
      explanationSource = "local";
    }
  }

  return {
    aiLabel,
    aiScore,
    aiModel: "logreg-ceas08-tfidf",
    aiExplanation,
    explanationSource,
    findings,
  };
}

async function classifyEmailWithAI(email) {
  return classifyEmailBasic(email);
}

module.exports = {
  classifyEmailWithAI,
  extractFindings,
};