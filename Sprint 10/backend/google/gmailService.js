// backend/google/gmailService.js

const fs = require("fs/promises");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

// This file is inside backend/google,
// so credentials.json and token.json are stored in this same folder.
const GOOGLE_DIR = __dirname;
const CREDENTIALS_PATH = path.join(GOOGLE_DIR, "credentials.json");
const TOKEN_PATH = path.join(GOOGLE_DIR, "token.json");

/* =========================================================
   OAuth / authentication
   ========================================================= */

async function loadCredentials() {
  const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
  const credentials = JSON.parse(content);

  const installed = credentials.installed || credentials.web;

  if (!installed) {
    throw new Error(
      "Invalid Google credentials file. Expected an installed or web OAuth client."
    );
  }

  return installed;
}

async function loadToken() {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function saveToken(token) {
  await fs.mkdir(GOOGLE_DIR, { recursive: true });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2), "utf8");
}

async function getOAuthClient() {
  const credentials = await loadCredentials();

  const redirectUri =
    Array.isArray(credentials.redirect_uris) && credentials.redirect_uris.length
      ? credentials.redirect_uris[0]
      : "http://localhost";

  const client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    redirectUri
  );

  const token = await loadToken();

  if (token) {
    client.setCredentials(token);
  }

  return client;
}

async function getAuthUrl() {
  const client = await getOAuthClient();

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

async function saveAuthCode(code) {
  if (!code || typeof code !== "string") {
    throw new Error("Google auth code is required.");
  }

  const client = await getOAuthClient();
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);
  await saveToken(tokens);

  return tokens;
}

async function getGmailClient() {
  const auth = await getOAuthClient();

  if (!auth.credentials || !auth.credentials.access_token) {
    throw new Error(
      "Gmail is not authenticated. Generate an auth URL and save an auth code first."
    );
  }

  return google.gmail({ version: "v1", auth });
}

/* =========================================================
   Gmail message helpers
   ========================================================= */

function decodeBase64Url(data = "") {
  if (!data) return "";

  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
}

function encodeBase64Url(value = "") {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function findHeader(headers = [], name) {
  const header = headers.find(
    (item) => String(item.name).toLowerCase() === String(name).toLowerCase()
  );

  return header?.value || "";
}

function stripHtml(html = "") {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextFromPayload(payload) {
  if (!payload) return "";

  // Direct plain text body
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data).trim();
  }

  // Direct HTML body
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data));
  }

  if (Array.isArray(payload.parts)) {
    const plainTextParts = [];
    const htmlParts = [];

    function collectParts(parts) {
      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          plainTextParts.push(decodeBase64Url(part.body.data).trim());
          continue;
        }

        if (part.mimeType === "text/html" && part.body?.data) {
          htmlParts.push(stripHtml(decodeBase64Url(part.body.data)));
          continue;
        }

        if (Array.isArray(part.parts)) {
          collectParts(part.parts);
        }
      }
    }

    collectParts(payload.parts);

    // Prefer text/plain because it is usually the clean email body.
    if (plainTextParts.length > 0) {
      return [...new Set(plainTextParts.filter(Boolean))].join("\n\n").trim();
    }

    // Only use HTML if plain text is not available.
    if (htmlParts.length > 0) {
      return [...new Set(htmlParts.filter(Boolean))].join("\n\n").trim();
    }
  }

  return "";
}

function countUrls(text = "") {
  const matches = String(text).match(/https?:\/\/[^\s)>\]]+/gi);
  return matches ? matches.length : 0;
}

function normaliseGmailMessage(fullMessage) {
  const data = fullMessage?.data || {};
  const payload = data.payload || {};
  const headers = payload.headers || [];

  const body = extractTextFromPayload(payload);

  return {
    externalMessageId: data.id,
    externalThreadId: data.threadId || null,
    sender: findHeader(headers, "From"),
    toRecipients: findHeader(headers, "To"),
    ccRecipients: findHeader(headers, "Cc"),
    bccRecipients: "",
    subject: findHeader(headers, "Subject") || "(No subject)",
    date: findHeader(headers, "Date") || new Date().toISOString(),
    body,
    urls: countUrls(body),
  };
}

/* =========================================================
   Gmail receiving/importing
   ========================================================= */

async function listUnreadMessageIds(maxResults = 10) {
  const gmail = await getGmailClient();

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox is:unread",
    maxResults,
  });

  return response.data.messages || [];
}

async function getMessageById(messageId) {
  if (!messageId) {
    throw new Error("Gmail message ID is required.");
  }

  const gmail = await getGmailClient();

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  return normaliseGmailMessage(response);
}

async function markMessageAsRead(messageId) {
  if (!messageId) {
    throw new Error("Gmail message ID is required.");
  }

  const gmail = await getGmailClient();

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

/* =========================================================
   Gmail sending
   ========================================================= */

function buildRawEmail({ from = "", to, cc = "", bcc = "", subject, body }) {
  if (!to || typeof to !== "string") {
    throw new Error("Recipient address is required.");
  }

  const headers = [
    from ? `From: ${from}` : "",
    `To: ${to}`,
    cc ? `Cc: ${cc}` : "",
    bcc ? `Bcc: ${bcc}` : "",
    `Subject: ${subject || "(No subject)"}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
  ].filter(Boolean);

  return encodeBase64Url(`${headers.join("\r\n")}\r\n\r\n${body || ""}`);
}

async function sendGmailMessage({ from = "", to, cc = "", bcc = "", subject, body }) {
  const gmail = await getGmailClient();

  const raw = buildRawEmail({
    from,
    to,
    cc,
    bcc,
    subject,
    body,
  });

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
    },
  });

  return response.data;
}

module.exports = {
  // auth
  getAuthUrl,
  saveAuthCode,
  getGmailClient,

  // receive/import
  listUnreadMessageIds,
  getMessageById,
  markMessageAsRead,

  // send
  sendGmailMessage,

  // helpers exported for testing/debugging if needed
  normaliseGmailMessage,
  extractTextFromPayload,
};