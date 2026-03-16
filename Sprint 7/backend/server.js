// backend/server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const { classifyEmailWithAI } = require("./ai");

const app = express();
const PORT = 4000;

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
    subject: row.subject,
    body: row.body,
    date: row.date,
    group: row.groupLabel,
    isUnread: !!row.isUnread,
    isFlagged: !!row.isFlagged,
    isPinned: !!row.isPinned,
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
      subject,
      body,
      date,
      groupLabel,
      isUnread,
      isFlagged,
      isPinned,
      urls,
      groundTruthLabel,
      sourceDataset,
      aiLabel,
      aiScore,
      aiModel,
      aiExplanation,
      aiFindings
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    emailData.folder,
    emailData.sender,
    emailData.subject,
    emailData.body || "",
    emailData.date || getNowDateString(),
    emailData.groupLabel || "Today",
    emailData.isUnread ? 1 : 0,
    emailData.isFlagged ? 1 : 0,
    emailData.isPinned ? 1 : 0,
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

app.get("/api/emails", (req, res) => {
  const folder = req.query.folder || "Inbox";
  const search = (req.query.search || "").trim().toLowerCase();
  const flaggedOnly = req.query.flaggedOnly === "true";

  let sql;
  const params = [];

  if (flaggedOnly) {
    sql = "SELECT * FROM emails WHERE isFlagged = 1";
  } else {
    sql = "SELECT * FROM emails WHERE folder = ?";
    params.push(folder);
  }

  if (search) {
    sql +=
      " AND (LOWER(subject) LIKE ? OR LOWER(sender) LIKE ? OR LOWER(body) LIKE ?)";
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  sql += " ORDER BY groupLabel DESC, id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Error fetching emails:", err);
      return res.status(500).json({ error: "Failed to fetch emails" });
    }

    res.json(rows.map(mapEmailRow));
  });
});

app.get("/api/emails/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM emails WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error fetching email:", err);
      return res.status(500).json({ error: "Failed to fetch email" });
    }

    if (!row) {
      return res.status(404).json({ error: "Email not found" });
    }

    res.json(mapEmailRow(row));
  });
});

app.post("/api/emails", async (req, res) => {
  try {
    const { sender, subject, body } = req.body || {};

    if (!sender || !subject) {
      return res.status(400).json({ error: "sender and subject are required" });
    }

    let aiResult = null;

    try {
      aiResult = await classifyEmailWithAI({
        sender,
        subject,
        body: body || "",
      });
    } catch (aiErr) {
      console.error("AI classification failed for sent email:", aiErr);
    }

    insertEmail(
      {
        folder: "Sent",
        sender,
        subject,
        body: body || "",
        date: getNowDateString(),
        groupLabel: "Today",
        isUnread: false,
        isFlagged: aiResult?.aiLabel === "phishing",
        isPinned: false,
        urls: 0,
        groundTruthLabel: null,
        sourceDataset: null,
        aiLabel: aiResult?.aiLabel || null,
        aiScore: aiResult?.aiScore ?? null,
        aiModel: aiResult?.aiModel || null,
        aiExplanation: aiResult?.aiExplanation || null,
        findings: aiResult?.findings || [],
      },
      (err, row) => {
        if (err) {
          console.error("Error inserting email:", err);
          return res.status(500).json({ error: "Failed to send email" });
        }

        res.status(201).json(mapEmailRow(row));
      }
    );
  } catch (err) {
    console.error("Unexpected error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.patch("/api/emails/:id", (req, res) => {
  const id = req.params.id;
  const { isUnread, isFlagged, isPinned, folder } = req.body || {};

  const fields = [];
  const params = [];

  if (typeof isUnread === "boolean") {
    fields.push("isUnread = ?");
    params.push(isUnread ? 1 : 0);
  }

  if (typeof isFlagged === "boolean") {
    fields.push("isFlagged = ?");
    params.push(isFlagged ? 1 : 0);
  }

  if (typeof isPinned === "boolean") {
    fields.push("isPinned = ?");
    params.push(isPinned ? 1 : 0);
  }

  if (typeof folder === "string" && folder.trim()) {
    fields.push("folder = ?");
    params.push(folder.trim());
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No valid fields provided" });
  }

  const sql = `UPDATE emails SET ${fields.join(", ")} WHERE id = ?`;
  params.push(id);

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error updating email:", err);
      return res.status(500).json({ error: "Failed to update email" });
    }

    db.get("SELECT * FROM emails WHERE id = ?", [id], (err2, row) => {
      if (err2) {
        console.error("Error fetching updated email:", err2);
        return res.status(500).json({ error: "Email updated but fetch failed" });
      }

      if (!row) {
        return res.status(404).json({ error: "Email not found" });
      }

      res.json(mapEmailRow(row));
    });
  });
});

app.post("/api/dev/spawn-email", (req, res) => {
  const body = req.body || {};
  let { type, count } = body;

  let mode;
  if (type === "phish" || type === "random") {
    mode = type;
  } else {
    mode = "normal";
  }

  let n = parseInt(count, 10);
  if (!Number.isInteger(n) || n < 1) {
    n = 1;
  }

  const created = [];

  function spawnOnce(callback) {
    let thisType = mode;
    if (mode === "random") {
      thisType = Math.random() < 0.5 ? "normal" : "phish";
    }

    const corpusTable = thisType === "phish" ? "phish_corpus" : "normal_corpus";
    const groundTruthLabel = thisType === "phish" ? "phishing" : "benign";

    const sqlRandom = `SELECT * FROM ${corpusTable} ORDER BY RANDOM() LIMIT 1`;

    db.get(sqlRandom, [], async (err, row) => {
      if (err) return callback(err);
      if (!row) {
        return callback(new Error(`No emails available in ${corpusTable}`));
      }

      let aiResult = null;

      try {
        aiResult = await classifyEmailWithAI({
          sender: row.sender,
          subject: row.subject,
          body: row.body || "",
        });
      } catch (aiErr) {
        console.error("Error classifying email with ML:", aiErr);
      }

      insertEmail(
        {
          folder: "Inbox",
          sender: row.sender,
          subject: row.subject,
          body: row.body || "",
          date: getNowDateString(),
          groupLabel: "Today",
          isUnread: true,
          isFlagged: aiResult?.aiLabel === "phishing",
          isPinned: false,
          urls: row.urls || 0,
          groundTruthLabel,
          sourceDataset: corpusTable,
          aiLabel: aiResult?.aiLabel || null,
          aiScore: aiResult?.aiScore ?? null,
          aiModel: aiResult?.aiModel || null,
          aiExplanation: aiResult?.aiExplanation || null,
          findings: aiResult?.findings || [],
        },
        (insertErr, emailRow) => {
          if (insertErr) return callback(insertErr);
          created.push(mapEmailRow(emailRow));
          callback(null);
        }
      );
    });
  }

  function runSpawn(index) {
    if (index >= n) {
      return res.status(201).json(created);
    }

    spawnOnce((err) => {
      if (err) {
        console.error("Error spawning email:", err.message || err);
        if (created.length > 0) {
          return res.status(201).json(created);
        }
        return res.status(500).json({ error: "Failed to spawn email(s)" });
      }

      runSpawn(index + 1);
    });
  }

  runSpawn(0);
});

app.delete("/api/dev/clear-inbox", (req, res) => {
  db.run("DELETE FROM emails WHERE folder = 'Inbox'", function (err) {
    if (err) {
      console.error("Error clearing inbox:", err);
      return res.status(500).json({ error: "Failed to clear inbox" });
    }

    res.json({ deleted: this.changes });
  });
});

app.delete("/api/dev/clear-flagged", (req, res) => {
  db.run("DELETE FROM emails WHERE isFlagged = 1", function (err) {
    if (err) {
      console.error("Error clearing flagged emails:", err);
      return res.status(500).json({ error: "Failed to clear flagged emails" });
    }

    res.json({ deleted: this.changes });
  });
});

app.post("/api/ai/classify", async (req, res) => {
  try {
    const { sender, subject, body, urls } = req.body || {};

    if (!sender || !subject) {
      return res
        .status(400)
        .json({ error: "sender and subject are required for AI classification" });
    }

    const result = await classifyEmailWithAI({
      sender,
      subject,
      body: body || "",
      urls: Array.isArray(urls) ? urls : [],
    });

    res.json(result);
  } catch (err) {
    console.error("Error in /api/ai/classify:", err);
    res.status(500).json({ error: "AI classification failed" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mail API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;