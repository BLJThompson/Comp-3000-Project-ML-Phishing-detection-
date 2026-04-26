// backend/app.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");
const { classifyEmailWithAI } = require("./ai");
const emailRoutes = require("./routes/emailRoutes");
const aiRoutes = require("./routes/aiRoutes");
const devRoutes = require("./routes/devRoutes");
const createGmailController = require("./controllers/gmailController");
const createGmailRoutes = require("./routes/gmailRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

function safeJsonParse(value, fallback = null) {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapEmailRow(row) {
  return {
    id: row.id,
    folder: row.folder,
    sender: row.sender,
    toRecipients: row.toRecipients || "",
    ccRecipients: row.ccRecipients || "",
    bccRecipients: row.bccRecipients || "",
    subject: row.subject,
    body: row.body,
    date: row.date,
    group: row.groupLabel,
    isUnread: !!row.isUnread,
    isFlagged: !!row.isFlagged,
    isPinned: !!row.isPinned,
    isDraft: !!row.isDraft,
    isJunk: !!row.isJunk,
    deletedFromFolder: row.deletedFromFolder || null,
    threadId: row.threadId || null,
    replyToId: row.replyToId || null,
    urls: row.urls || 0,
    groundTruthLabel: row.groundTruthLabel || null,
    sourceDataset: row.sourceDataset || null,
    aiLabel: row.aiLabel || null,
    aiScore: typeof row.aiScore === "number" ? row.aiScore : null,
    aiModel: row.aiModel || null,
    aiExplanation: row.aiExplanation || null,
    findings: safeJsonParse(row.aiFindings, []),
  };
}

function getNowDateString() {
  return new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function insertEmail(emailData, callback) {
  const sql = `
    INSERT INTO emails (
      folder,
      sender,
      toRecipients,
      ccRecipients,
      bccRecipients,
      subject,
      body,
      date,
      groupLabel,
      isUnread,
      isFlagged,
      isPinned,
      isDraft,
      isJunk,
      deletedFromFolder,
      threadId,
      replyToId,
      urls,
      groundTruthLabel,
      sourceDataset,
      aiLabel,
      aiScore,
      aiModel,
      aiExplanation,
      aiFindings,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  const params = [
    emailData.folder,
    emailData.sender,
    emailData.toRecipients || "",
    emailData.ccRecipients || "",
    emailData.bccRecipients || "",
    emailData.subject || "",
    emailData.body || "",
    emailData.date || getNowDateString(),
    emailData.groupLabel || "Today",
    emailData.isUnread ? 1 : 0,
    emailData.isFlagged ? 1 : 0,
    emailData.isPinned ? 1 : 0,
    emailData.isDraft ? 1 : 0,
    emailData.isJunk ? 1 : 0,
    emailData.deletedFromFolder || null,
    emailData.threadId || null,
    emailData.replyToId || null,
    emailData.urls || 0,
    emailData.groundTruthLabel || null,
    emailData.sourceDataset || null,
    emailData.aiLabel || null,
    typeof emailData.aiScore === "number" ? emailData.aiScore : null,
    emailData.aiModel || null,
    emailData.aiExplanation || null,
    JSON.stringify(Array.isArray(emailData.findings) ? emailData.findings : []),
  ];

  db.run(sql, params, function (err) {
    if (err) return callback(err);

    db.get("SELECT * FROM emails WHERE id = ?", [this.lastID], (err2, row) => {
      if (err2) return callback(err2);
      callback(null, row);
    });
  });
}

const sharedDeps = {
  db,
  classifyEmailWithAI,
  mapEmailRow,
  insertEmail,
  getNowDateString,
};

const gmailController = createGmailController(sharedDeps);

app.use("/api/emails", emailRoutes(sharedDeps));
app.use("/api/ai", aiRoutes(sharedDeps));
app.use("/api/dev", devRoutes(sharedDeps));
app.use("/api/gmail", createGmailRoutes(gmailController));

module.exports = app;