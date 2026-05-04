// backend/db/emailStore.js

const db = require("./index");

// Returns a locale-formatted date string for the current time.
function getNowDateString() {
  return new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Parses a JSON string safely, returning fallback on any failure.
function safeJsonParse(value, fallback = null) {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Maps a raw database row to the shape the frontend expects.
// SQLite stores booleans as 0/1 integers so !! is used to coerce them.
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

// Inserts a new email and returns the saved row via callback.
function insertEmail(emailData, callback) {
  const sql = `
    INSERT INTO emails (
      folder, sender, toRecipients, ccRecipients, bccRecipients,
      subject, body, date, groupLabel,
      isUnread, isFlagged, isPinned, isDraft, isJunk,
      deletedFromFolder, threadId, replyToId,
      urls, groundTruthLabel, sourceDataset,
      aiLabel, aiScore, aiModel, aiExplanation, aiFindings,
      createdAt, updatedAt
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

module.exports = { getNowDateString, mapEmailRow, insertEmail };
