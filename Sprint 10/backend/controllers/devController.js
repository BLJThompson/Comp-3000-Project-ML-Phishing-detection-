// backend/controllers/devController.js

const { chooseIncomingFolderFromAI } = require("../emailRouting");

function createDevController({
  db,
  classifyEmailWithAI,
  mapEmailRow,
  insertEmail,
  getNowDateString,
}) {
  const JUNK_SCORE_THRESHOLD = 0.9;


return {
    spawnEmail(req, res) {
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

        const corpusTable =
          thisType === "phish" ? "phish_corpus" : "normal_corpus";
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

          const folderDecision = chooseIncomingFolderFromAI(aiResult);

          insertEmail(
            {
              folder: folderDecision.folder,
              sender: row.sender,
              toRecipients: "",
              ccRecipients: "",
              bccRecipients: "",
              subject: row.subject,
              body: row.body || "",
              date: getNowDateString(),
              groupLabel: "Today",
              isUnread: true,
              isFlagged: folderDecision.isFlagged,
              isPinned: false,
              isDraft: false,
              isJunk: folderDecision.isJunk,
              deletedFromFolder: null,
              threadId: null,
              replyToId: null,
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
    },

    clearInbox(req, res) {
      db.run("DELETE FROM emails WHERE folder = 'Inbox'", function (err) {
        if (err) {
          console.error("Error clearing inbox:", err);
          return res.status(500).json({ error: "Failed to clear inbox" });
        }

        res.json({ success: true, deleted: this.changes });
      });
    },

    clearFlagged(req, res) {
      db.run("DELETE FROM emails WHERE folder = 'Flagged'", function (err) {
        if (err) {
          console.error("Error clearing flagged emails:", err);
          return res
            .status(500)
            .json({ error: "Failed to clear flagged emails" });
        }

        res.json({ success: true, deleted: this.changes });
      });
    },

    clearAllEmails(req, res) {
      db.run("DELETE FROM emails", function (err) {
        if (err) {
          console.error("Error clearing all emails:", err);
          return res.status(500).json({ error: "Failed to clear all emails" });
        }

        res.json({ success: true, deleted: this.changes });
      });
    },
  };
}

module.exports = createDevController;