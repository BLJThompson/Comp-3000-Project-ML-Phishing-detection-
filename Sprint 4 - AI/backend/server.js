// backend/server.js

require("dotenv").config();


const express = require("express");
const cors = require("cors");
const db = require("./db");

const {
  classifyEmailWithAI,
} = require("./ai");


const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

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
  };
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

app.post("/api/emails", (req, res) => {
  const { sender, subject, body } = req.body || {};

  if (!sender || !subject) {
    return res.status(400).json({ error: "sender and subject are required" });
  }

  const date = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const groupLabel = "Today";

  const sql = `INSERT INTO emails 
    (folder, sender, subject, body, date, groupLabel, isUnread, isFlagged, isPinned, urls, groundTruthLabel, sourceDataset)
    VALUES ('Sent', ?, ?, ?, ?, ?, 0, 0, 0, 0, NULL, NULL)`;

  db.run(sql, [sender, subject, body || "", date, groupLabel], function (err) {
    if (err) {
      console.error("Error inserting email:", err);
      return res.status(500).json({ error: "Failed to send email" });
    }

    db.get("SELECT * FROM emails WHERE id = ?", [this.lastID], (err2, row) => {
      if (err2) {
        console.error("Error reading new email:", err2);
        return res
          .status(500)
          .json({ error: "Email sent but retrieval failed" });
      }
      res.status(201).json(mapEmailRow(row));
    });
  });
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
  if (typeof folder === "string") {
    fields.push("folder = ?");
    params.push(folder);
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
        return res
          .status(500)
          .json({ error: "Email updated but fetch failed" });
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

    db.get(sqlRandom, [], (err, row) => {
      if (err) return callback(err);
      if (!row) {
        return callback(new Error(`No emails available in ${corpusTable}`));
      }

      classifyEmailWithAI({
        sender: row.sender,
        subject: row.subject,
        body: row.body || "",
      })
        .then((aiResult) => {
          const isFlagged = aiResult.aiLabel === "phishing" ? 1 : 0;

          const date = new Date().toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          const groupLabel = "Today";
          const urlsFlag = row.urls || 0;

          const insertSql = `INSERT INTO emails
            (folder, sender, subject, body, date, groupLabel, isUnread, isFlagged, isPinned, urls, groundTruthLabel, sourceDataset)
            VALUES ('Inbox', ?, ?, ?, ?, ?, 1, ?, 0, ?, ?, ?)`;

          db.run(
            insertSql,
            [
              row.sender,
              row.subject,
              row.body,
              date,
              groupLabel,
              isFlagged,
              urlsFlag,
              groundTruthLabel,
              corpusTable,
            ],
            function (err2) {
              if (err2) return callback(err2);

              db.get(
                "SELECT * FROM emails WHERE id = ?",
                [this.lastID],
                (err3, emailRow) => {
                  if (err3) return callback(err3);
                  created.push(mapEmailRow(emailRow));
                  callback(null);
                }
              );
            }
          );
        })
        .catch((e) => {
          console.error("Error classifying email with ML:", e);

          const date = new Date().toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          const groupLabel = "Today";
          const urlsFlag = row.urls || 0;

          const insertSql = `INSERT INTO emails
            (folder, sender, subject, body, date, groupLabel, isUnread, isFlagged, isPinned, urls, groundTruthLabel, sourceDataset)
            VALUES ('Inbox', ?, ?, ?, ?, ?, 1, 0, 0, ?, ?, ?)`;

          db.run(
            insertSql,
            [
              row.sender,
              row.subject,
              row.body,
              date,
              groupLabel,
              urlsFlag,
              groundTruthLabel,
              corpusTable,
            ],
            function (err2) {
              if (err2) return callback(err2);

              db.get(
                "SELECT * FROM emails WHERE id = ?",
                [this.lastID],
                (err3, emailRow) => {
                  if (err3) return callback(err3);
                  created.push(mapEmailRow(emailRow));
                  callback(null);
                }
              );
            }
          );
        });
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


app.listen(PORT, () => {
  console.log(`Mail API listening on http://localhost:${PORT}`);
});
