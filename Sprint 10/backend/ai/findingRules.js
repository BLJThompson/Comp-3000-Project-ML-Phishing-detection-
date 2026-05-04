// backend/ai/findingRules.js

//  Module-level constants 
// Defined here so they are not rebuilt on every call to extractFindings.

const KNOWN_BRANDS = [
  { name: "cnn",        domains: ["cnn.com"] },
  { name: "paypal",     domains: ["paypal.com"] },
  { name: "microsoft",  domains: ["microsoft.com", "outlook.com", "live.com"] },
  { name: "apple",      domains: ["apple.com", "icloud.com"] },
  { name: "amazon",     domains: ["amazon.com", "amazon.co.uk"] },
  { name: "netflix",    domains: ["netflix.com"] },
  { name: "hmrc",       domains: ["hmrc.gov.uk"] },
  { name: "royal mail", domains: ["royalmail.com"] },
  { name: "dhl",        domains: ["dhl.com"] },
  { name: "visa",       domains: ["visa.com"] },
  { name: "mastercard", domains: ["mastercard.com"] },
  { name: "bank",       domains: [] },
];

// Domains with empty arrays match any sender domain (e.g. "bank" is generic).
const SUSPICIOUS_SENDER_PATTERNS = [
  /@.*\.ru$/i,
  /@.*\.cn$/i,
  /@.*\.tk$/i,
  /@.*\.top$/i,
  /@.*\.xyz$/i,
];

const URL_REGEX = /https?:\/\/[^\s)>\]]+/gi;

const SHORTENER_DOMAINS = ["bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly", "buff.ly"];

// URLs containing these hints are skipped — they appear in legitimate emails.
const SAFE_URL_HINTS = [
  "mailman/listinfo", "unsubscribe", "privacy",
  "feedback", "news", "article", "docs", "documentation",
];

// URLs containing these hints are flagged at medium severity.
const SUSPICIOUS_URL_HINTS = [
  "login", "verify", "secure", "update", "account",
  "bank", "paypal", "signin", "confirm", "password",
  "billing", "refund", "unlock", "security",
];

// Human-readable labels used when building the fallback explanation string.
const FINDING_TYPE_LABELS = {
  urgency:                  "urgency language",
  credential_request:       "credential requests",
  suspicious_link:          "suspicious links",
  suspicious_subject:       "suspicious subject wording",
  financial_request:        "financial pressure",
  threat_language:          "threat language",
  prize_scam:               "prize scam language",
  reward_bait:              "reward or bonus bait",
  promotional_bait:         "promotional bait language",
  spam_offer:               "spam-style offer language",
  brand_reference:          "trusted brand references",
  scam_subject:             "scam-style subject bait",
  sensitive_info_request:   "requests for sensitive information",
  sender_mismatch:          "sender/domain mismatch",
  suspicious_sender_domain: "suspicious sender domain",
  bulk_mail_marker:         "bulk-mail markers",
  bulk_mail_subject:        "newsletter-style subject",
  forwarded_bait:           "forwarded-style subject bait",
  hype_punctuation:         "excessive punctuation",
};

//  String utilities 

function safeString(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function extractEmailAddress(sender = "") {
  const angleMatch = sender.match(/<([^>]+)>/);
  if (angleMatch) return angleMatch[1].trim().toLowerCase();

  const plainMatch = sender.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  if (plainMatch) return plainMatch[0].trim().toLowerCase();

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

//  Finding builders 

function makeFinding({ field, type, severity, reason, text, start, end }) {
  return { field, type, severity, reason, text, start, end };
}

function addMatch(findings, field, type, severity, reason, text, start, end) {
  findings.push(makeFinding({ field, type, severity, reason, text, start, end }));
}

// Runs a regex over text and pushes a finding for each match.
function addMatches(findings, text, field, regex, type, severity, reason) {
  for (const match of text.matchAll(regex)) {
    addMatch(findings, field, type, severity, reason, match[0], match.index, match.index + match[0].length);
  }
}

// Pushes a sender-field finding, calculating the highlight range within the raw sender string.
function addSenderEmailFinding(findings, sender, emailAddress, type, severity, reason) {
  const senderText = sender || "";
  const highlightedText = emailAddress || senderText;

  let start = 0;
  let end = senderText.length;

  if (emailAddress) {
    const idx = senderText.toLowerCase().indexOf(emailAddress.toLowerCase());
    if (idx !== -1) {
      start = idx;
      end = idx + emailAddress.length;
    }
  }

  findings.push(makeFinding({ field: "sender", type, severity, reason, text: highlightedText, start, end }));
}

//  Deduplication 

// Removes duplicate findings, keeping the highest-severity entry for each position.
function dedupeFindings(findings) {
  const seen = new Set();
  const severityWeight = { high: 3, medium: 2, low: 1 };

  const sorted = [...findings].sort((a, b) => {
    if (a.field !== b.field) return a.field.localeCompare(b.field);
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return a.end - b.end;
    return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
  });

  return sorted.filter((f) => {
    const key = `${f.field}:${f.start}:${f.end}:${f.type}:${f.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasFinding(findings, type) {
  return findings.some((f) => f.type === type);
}

function hasHighSeverity(findings) {
  return findings.some((f) => f.severity === "high");
}

//  Main analysis 

function extractFindings(email) {
  const findings = [];

  const sender  = safeString(email.sender);
  const subject = safeString(email.subject);
  const body    = safeString(email.body);

  const lowerSubject = subject.toLowerCase();
  const lowerBody    = body.toLowerCase();

  // Subject rules
  addMatches(findings, subject, "subject",
    /\b(account suspended|security alert|password reset|unusual activity|verify now|urgent action required|final warning)\b/gi,
    "suspicious_subject", "high", "Subject resembles a common phishing lure.");

  addMatches(findings, subject, "subject",
    /\b(congratulations|you are a winner|claim now|limited offer|special promotion)\b/gi,
    "scam_subject", "medium", "Subject uses promotional or scam-style bait language.");

  addMatches(findings, subject, "subject",
    /\b(daily top 10|newsletter|news alert|account notice|important update)\b/gi,
    "bulk_mail_subject", "low", "Subject resembles a bulk-email or newsletter pattern.");

  addMatches(findings, subject, "subject",
    /\b(bonus|grant|reward|special bonus|exclusive bonus|free bonus)\b/gi,
    "reward_bait", "medium", "Uses reward or bonus language often seen in scam emails.");

  addMatches(findings, subject, "subject",
    /\b(fw:|fwd:)\b/gi,
    "forwarded_bait", "low", "Uses a forwarded-style subject which can be used in spam bait.");

  addMatches(findings, subject, "subject",
    /!{2,}/g,
    "hype_punctuation", "low", "Uses excessive punctuation common in spam or scam messages.");

  // Body rules — high severity
  addMatches(findings, body, "body",
    /\b(verify your account|confirm your account|confirm password|verify your password|login now|sign in now|update your account|reset your password|confirm your identity|validate your account|re-enter your password)\b/gi,
    "credential_request", "high", "Requests account credentials or account verification.");

  addMatches(findings, body, "body",
    /\b(account will be locked|account has been suspended|service will be suspended|your access will be removed|failure to respond|unauthorised activity detected|unauthorized activity detected)\b/gi,
    "threat_language", "high", "Uses threats or consequences to pressure action.");

  addMatches(findings, body, "body",
    /\b(payment required|bank account|transfer funds|wire transfer|invoice attached|outstanding balance|confirm your payment|billing issue|refund available|payment failed)\b/gi,
    "financial_request", "high", "References money, banking, or payment pressure.");

  addMatches(findings, body, "body",
    /\b(provide your details|send your password|confirm your login|submit your credentials|enter your card details|confirm your bank details)\b/gi,
    "sensitive_info_request", "high", "Requests sensitive personal or account information.");

  // Body rules — medium severity
  addMatches(findings, body, "body",
    /\b(congratulations|winner|claim your prize|claim now|you have been selected|lottery|jackpot|free gift|exclusive offer|limited offer)\b/gi,
    "prize_scam", "medium", "Uses prize or reward language common in scam emails.");

  addMatches(findings, body, "body",
    /\b(bonus|grant|reward|special bonus|exclusive bonus|free bonus|feel well)\b/gi,
    "reward_bait", "medium", "Uses reward or bonus language often seen in scam emails.");

  addMatches(findings, body, "body",
    /\b(receive our|get our|claim our|take our)\b/gi,
    "promotional_bait", "medium", "Uses promotional bait phrasing common in spam or scam messages.");

  addMatches(findings, body, "body",
    /\b(cheap|discount|buy now|order now|limited time|special offer|replica|online store|luxury watches|rolex|pharmacy|medications|drugs|enhancement|male enhancement)\b/gi,
    "spam_offer", "medium", "Contains commercial spam or scam-style offer language.");

  // Body rules — low severity
  addMatches(findings, body, "body",
    /\b(unsubscribe|manage your settings|privacy policy|all rights reserved)\b/gi,
    "bulk_mail_marker", "low", "Contains bulk-mail or newsletter footer language.");

  // Starts low — upgraded later if paired with stronger signals.
  addMatches(findings, body, "body",
    /\b(urgent|immediately|as soon as possible|within 24 hours|within 48 hours|final warning|act now|action required|suspended|locked|expires today|respond now)\b/gi,
    "urgency", "low", "Contains urgency language.");

  // Brand references — checked in both body and subject in a single loop.
  for (const brand of KNOWN_BRANDS) {
    const brandRegex = new RegExp(`\\b${brand.name.replace(/\s+/g, "\\s+")}\\b`, "gi");
    const reason = "Mentions a trusted brand or service often used in impersonation attempts.";

    for (const field of ["body", "subject"]) {
      const text = field === "body" ? body : subject;
      for (const match of text.matchAll(brandRegex)) {
        addMatch(findings, field, "brand_reference", "low", reason, match[0], match.index, match.index + match[0].length);
      }
    }
  }

  // URL analysis
  for (const match of body.matchAll(URL_REGEX)) {
    const urlText = match[0];
    const lower   = urlText.toLowerCase();

    if (SAFE_URL_HINTS.some((hint) => lower.includes(hint))) continue;

    const isShortener = SHORTENER_DOMAINS.some((d) => lower.includes(d));
    const isIpUrl     = /https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(urlText);
    const hasOddTld   = /\.(tk|xyz|top|ru|cn)(\/|$)/i.test(lower);

    if (isShortener || isIpUrl || hasOddTld) {
      const reason = isShortener
        ? "Uses a shortened or obscured link."
        : isIpUrl
        ? "Uses a raw IP address in the link."
        : "Uses a domain pattern often associated with suspicious links.";
      addMatch(findings, "body", "suspicious_link", "high", reason, urlText, match.index, match.index + urlText.length);
      continue;
    }

    if (SUSPICIOUS_URL_HINTS.some((hint) => lower.includes(hint))) {
      addMatch(findings, "body", "suspicious_link", "medium",
        "Link contains keywords commonly associated with phishing pages.",
        urlText, match.index, match.index + urlText.length);
    }
  }

  // Sender / domain checks
  const emailAddress = extractEmailAddress(sender);
  const senderDomain = extractDomain(emailAddress);
  const displayName  = extractDisplayName(sender).toLowerCase();

  if (emailAddress) {
    for (const brand of KNOWN_BRANDS) {
      const referencesBrand =
        displayName.includes(brand.name) ||
        lowerSubject.includes(brand.name) ||
        lowerBody.includes(brand.name);

      const domainMatchesBrand =
        brand.domains.length === 0 ||
        brand.domains.some((d) => senderDomain === d || senderDomain.endsWith(`.${d}`));

      if (referencesBrand && !domainMatchesBrand) {
        addSenderEmailFinding(findings, sender, emailAddress, "sender_mismatch", "high",
          `Message references ${brand.name}, but the sender domain does not match the expected brand domain.`);
      }
    }

    if (SUSPICIOUS_SENDER_PATTERNS.some((p) => p.test(emailAddress))) {
      addSenderEmailFinding(findings, sender, emailAddress, "suspicious_sender_domain", "medium",
        "Sender uses a domain pattern commonly associated with suspicious email traffic.");
    }
  }

  // Upgrade urgency findings when paired with high-confidence phishing signals.
  const upgradedFindings = findings.map((f) => ({ ...f }));

  const shouldUpgradeUrgency =
    hasFinding(upgradedFindings, "credential_request") ||
    hasFinding(upgradedFindings, "threat_language") ||
    hasFinding(upgradedFindings, "financial_request") ||
    hasFinding(upgradedFindings, "sensitive_info_request");

  if (shouldUpgradeUrgency) {
    for (const f of upgradedFindings) {
      if (f.type === "urgency") {
        f.severity = "medium";
        f.reason = "Uses urgency language alongside stronger phishing indicators.";
      }
    }
  }

  return dedupeFindings(upgradedFindings);
}

//  Explanation builder 

function buildExplanation(aiLabel, aiScore, findings) {
  const score = aiScore.toFixed(3);

  if (aiLabel !== "phishing") {
    return `Local ML model classified this email as benign (score ${score}).`;
  }

  if (!findings.length) {
    return `Local ML model flagged this email as phishing (score ${score}).`;
  }

  const summary = [...new Set(findings.map((f) => FINDING_TYPE_LABELS[f.type] || f.type))]
    .slice(0, 3)
    .join(", ");

  return `Local ML model flagged this email as phishing (score ${score}) due to ${summary}.`;
}

function scoreFindings(findings) {
  const weights = { high: 3, medium: 2, low: 1 };
  return findings.reduce((sum, f) => sum + (weights[f.severity] || 0), 0);
}

// Only export what is used outside this file.
module.exports = {
  safeString,
  extractFindings,
  buildExplanation,
  scoreFindings,
  hasHighSeverity,
};
