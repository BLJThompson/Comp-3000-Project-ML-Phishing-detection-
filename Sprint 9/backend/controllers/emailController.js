// backend/controllers/emailController.js

function createEmailController({
  db,
  classifyEmailWithAI,
  mapEmailRow,
  insertEmail,
  getNowDateString,
}) {
  const VALID_FOLDERS = [
    "Inbox",
    "Drafts",
    "Sent",
    "Deleted",
    "Flagged",
    "Junk",
  ];

  const JUNK_SCORE_THRESHOLD = 0.9;

  function getEmailRowById(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM emails WHERE id = ?", [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  function getRowsByThreadId(threadId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM emails WHERE threadId = ? ORDER BY id ASC",
        [threadId],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  }

  function updateEmailRowById(id, fields, values) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE emails SET ${fields.join(
        ", "
      )}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;

      db.run(sql, [...values, id], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  function deleteEmailRowById(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM emails WHERE id = ?", [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  function runAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  function runGet(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  function insertEmailAsync(emailData) {
    return new Promise((resolve, reject) => {
      insertEmail(emailData, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async function returnEmailById(id, res) {
    const row = await getEmailRowById(id);

    if (!row) {
      return res.status(404).json({ error: "Email not found" });
    }

    return res.json(mapEmailRow(row));
  }

  function makeThreadId(seed = "new") {
    return `thread-${seed}-${Date.now()}`;
  }

  async function buildAIResult({ sender, subject, body }) {
    try {
      return await classifyEmailWithAI({
        sender,
        subject,
        body: body || "",
      });
    } catch (err) {
      console.error("AI classification failed:", err);
      return null;
    }
  }

  function chooseIncomingFolderFromAI(aiResult) {
    const isPhishing = aiResult?.aiLabel === "phishing";
    const aiScore =
      typeof aiResult?.aiScore === "number" ? aiResult.aiScore : 0;

    if (!isPhishing) {
      return {
        folder: "Inbox",
        isFlagged: false,
        isJunk: false,
      };
    }

    if (aiScore >= JUNK_SCORE_THRESHOLD) {
      return {
        folder: "Junk",
        isFlagged: false,
        isJunk: true,
      };
    }

    return {
      folder: "Flagged",
      isFlagged: true,
      isJunk: false,
    };
  }

  return {
    async getEmails(req, res) {
      try {
        const folder = req.query.folder || "Inbox";
        const search = (req.query.search || "").trim().toLowerCase();

        let sql = "SELECT * FROM emails WHERE folder = ?";
        const params = [folder];

        if (search) {
          sql +=
            " AND (LOWER(subject) LIKE ? OR LOWER(sender) LIKE ? OR LOWER(body) LIKE ? OR LOWER(toRecipients) LIKE ?)";
          const pattern = `%${search}%`;
          params.push(pattern, pattern, pattern, pattern);
        }

        sql += " ORDER BY id DESC";

        const rows = await runAll(sql, params);
        res.json(rows.map(mapEmailRow));
      } catch (err) {
        console.error("Error fetching emails:", err);
        res.status(500).json({ error: "Failed to fetch emails" });
      }
    },

    async getFolderCounts(req, res) {
      try {
        const folders = ["Inbox", "Drafts", "Sent", "Deleted", "Flagged", "Junk"];
        const counts = {};

        for (const folder of folders) {
          const row = await runGet(
            "SELECT COUNT(*) as count FROM emails WHERE folder = ?",
            [folder]
          );
          counts[folder] = row?.count || 0;
        }

        const totalRow = await runGet("SELECT COUNT(*) as count FROM emails");
        counts.Total = totalRow?.count || 0;

        const phishingRow = await runGet(
          "SELECT COUNT(*) as count FROM emails WHERE aiLabel = 'phishing'"
        );
        counts.Phishing = phishingRow?.count || 0;

        const benignRow = await runGet(
          "SELECT COUNT(*) as count FROM emails WHERE aiLabel = 'benign'"
        );
        counts.Benign = benignRow?.count || 0;

        res.json(counts);
      } catch (err) {
        console.error("Error getting folder counts:", err);
        res.status(500).json({ error: "Failed to fetch folder counts" });
      }
    },

    async getEmailById(req, res) {
      try {
        const row = await getEmailRowById(req.params.id);

        if (!row) {
          return res.status(404).json({ error: "Email not found" });
        }

        res.json(mapEmailRow(row));
      } catch (err) {
        console.error("Error fetching email:", err);
        res.status(500).json({ error: "Failed to fetch email" });
      }
    },

    async getEmailThread(req, res) {
      try {
        const email = await getEmailRowById(req.params.id);

        if (!email) {
          return res.status(404).json({ error: "Email not found" });
        }

        if (!email.threadId) {
          return res.json([mapEmailRow(email)]);
        }

        const rows = await getRowsByThreadId(email.threadId);
        res.json(rows.map(mapEmailRow));
      } catch (err) {
        console.error("Error fetching email thread:", err);
        res.status(500).json({ error: "Failed to fetch email thread" });
      }
    },

    async createEmail(req, res) {
      return this.sendEmail(req, res);
    },

    async sendEmail(req, res) {
      try {
        const {
          sender,
          toRecipients,
          ccRecipients,
          bccRecipients,
          subject,
          body,
          replyToId,
          threadId,
        } = req.body || {};

        if (!sender || !toRecipients || !subject) {
          return res.status(400).json({
            error: "sender, toRecipients, and subject are required",
          });
        }

        const outgoingThreadId = threadId || makeThreadId("new");

const aiResult = await buildAIResult({
  sender,
  subject,
  body,
});

// Sent copy
const sentRow = await insertEmailAsync({
  folder: "Sent",
  sender,
  toRecipients,
  ccRecipients: ccRecipients || "",
  bccRecipients: bccRecipients || "",
  subject,
  body: body || "",
  date: getNowDateString(),
  groupLabel: "Today",
  isUnread: false,
  isFlagged: false,
  isPinned: false,
  isDraft: false,
  isJunk: false,
  deletedFromFolder: null,
  replyToId: replyToId || null,
  threadId: outgoingThreadId,
  urls: 0,
  groundTruthLabel: null,
  sourceDataset: null,
  aiLabel: aiResult?.aiLabel || null,
  aiScore: aiResult?.aiScore ?? null,
  aiModel: aiResult?.aiModel || null,
  aiExplanation: aiResult?.aiExplanation || null,
  findings: aiResult?.findings || [],
});

const incomingDecision = chooseIncomingFolderFromAI(aiResult);

// Local received copy
await insertEmailAsync({
  folder: incomingDecision.folder,
  sender,
  toRecipients,
  ccRecipients: ccRecipients || "",
  bccRecipients: bccRecipients || "",
  subject,
  body: body || "",
  date: getNowDateString(),
  groupLabel: "Today",
  isUnread: true,
  isFlagged: incomingDecision.isFlagged,
  isPinned: false,
  isDraft: false,
  isJunk: incomingDecision.isJunk,
  deletedFromFolder: null,
  replyToId: replyToId || null,
  threadId: outgoingThreadId,
  urls: 0,
  groundTruthLabel: null,
  sourceDataset: null,
  aiLabel: aiResult?.aiLabel || null,
  aiScore: aiResult?.aiScore ?? null,
  aiModel: aiResult?.aiModel || null,
  aiExplanation: aiResult?.aiExplanation || null,
  findings: aiResult?.findings || [],
});

        res.status(201).json(mapEmailRow(sentRow));
      } catch (err) {
        console.error("Unexpected error sending email:", err);
        res.status(500).json({ error: "Failed to send email" });
      }
    },

    createDraft(req, res) {
      try {
        const {
          sender,
          toRecipients,
          ccRecipients,
          bccRecipients,
          subject,
          body,
          replyToId,
          threadId,
        } = req.body || {};

        insertEmail(
          {
            folder: "Drafts",
            sender: sender || "ben@example.com",
            toRecipients: toRecipients || "",
            ccRecipients: ccRecipients || "",
            bccRecipients: bccRecipients || "",
            subject: subject || "",
            body: body || "",
            date: getNowDateString(),
            groupLabel: "Today",
            isUnread: false,
            isFlagged: false,
            isPinned: false,
            isDraft: true,
            isJunk: false,
            deletedFromFolder: null,
            replyToId: replyToId || null,
            threadId: threadId || makeThreadId("draft"),
            urls: 0,
            groundTruthLabel: null,
            sourceDataset: null,
            aiLabel: null,
            aiScore: null,
            aiModel: null,
            aiExplanation: null,
            findings: [],
          },
          (err, row) => {
            if (err) {
              console.error("Error creating draft:", err);
              return res.status(500).json({ error: "Failed to create draft" });
            }

            res.status(201).json(mapEmailRow(row));
          }
        );
      } catch (err) {
        console.error("Unexpected error creating draft:", err);
        res.status(500).json({ error: "Failed to create draft" });
      }
    },

    async updateDraft(req, res) {
      try {
        const id = req.params.id;
        const draft = await getEmailRowById(id);

        if (!draft) {
          return res.status(404).json({ error: "Draft not found" });
        }

        if (draft.folder !== "Drafts") {
          return res.status(400).json({ error: "Only drafts can be updated" });
        }

        const {
          sender,
          toRecipients,
          ccRecipients,
          bccRecipients,
          subject,
          body,
        } = req.body || {};

        const fields = [
          "sender = ?",
          "toRecipients = ?",
          "ccRecipients = ?",
          "bccRecipients = ?",
          "subject = ?",
          "body = ?",
          "date = ?",
          "groupLabel = ?",
        ];

        const values = [
          sender ?? draft.sender ?? "ben@example.com",
          toRecipients ?? draft.toRecipients ?? "",
          ccRecipients ?? draft.ccRecipients ?? "",
          bccRecipients ?? draft.bccRecipients ?? "",
          subject ?? draft.subject ?? "",
          body ?? draft.body ?? "",
          getNowDateString(),
          "Today",
        ];

        await updateEmailRowById(id, fields, values);
        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error updating draft:", err);
        return res.status(500).json({ error: "Failed to update draft" });
      }
    },

    updateEmail(req, res) {
      const id = req.params.id;
      const { isUnread, isFlagged, isPinned, folder } = req.body || {};

      const fields = [];
      const params = [];

      if (typeof isUnread === "boolean") {
        fields.push("isUnread = ?");
        params.push(isUnread ? 1 : 0);
      }

      if (typeof isPinned === "boolean") {
        fields.push("isPinned = ?");
        params.push(isPinned ? 1 : 0);
      }

      if (typeof isFlagged === "boolean") {
        fields.push("isFlagged = ?");
        params.push(isFlagged ? 1 : 0);

        if (isFlagged) {
          fields.push("folder = ?");
          params.push("Flagged");
          fields.push("isJunk = ?");
          params.push(0);
        } else {
          fields.push("folder = ?");
          params.push("Inbox");
          fields.push("isJunk = ?");
          params.push(0);
        }
      } else if (typeof folder === "string" && folder.trim()) {
        const trimmedFolder = folder.trim();

        if (!VALID_FOLDERS.includes(trimmedFolder)) {
          return res.status(400).json({ error: "Invalid folder" });
        }

        fields.push("folder = ?");
        params.push(trimmedFolder);

        if (trimmedFolder === "Flagged") {
          fields.push("isFlagged = ?");
          params.push(1);
          fields.push("isJunk = ?");
          params.push(0);
        } else if (trimmedFolder === "Junk") {
          fields.push("isJunk = ?");
          params.push(1);
          fields.push("isFlagged = ?");
          params.push(0);
        } else {
          fields.push("isFlagged = ?");
          params.push(0);
          fields.push("isJunk = ?");
          params.push(0);
        }

        if (trimmedFolder === "Drafts") {
          fields.push("isDraft = ?");
          params.push(1);
        } else {
          fields.push("isDraft = ?");
          params.push(0);
        }
      }

      if (!fields.length) {
        return res.status(400).json({ error: "No valid fields provided" });
      }

      const sql = `UPDATE emails SET ${fields.join(
        ", "
      )}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
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
    },

    async moveEmail(req, res) {
      try {
        const id = req.params.id;
        const { folder } = req.body || {};

        if (!folder || typeof folder !== "string") {
          return res.status(400).json({ error: "Target folder is required" });
        }

        const targetFolder = folder.trim();

        if (!VALID_FOLDERS.includes(targetFolder)) {
          return res.status(400).json({ error: "Invalid target folder" });
        }

        const email = await getEmailRowById(id);

        if (!email) {
          return res.status(404).json({ error: "Email not found" });
        }

        const fields = ["folder = ?"];
        const values = [targetFolder];

        if (targetFolder === "Deleted") {
          fields.push("deletedFromFolder = ?");
          values.push(email.folder || "Inbox");
        } else {
          fields.push("deletedFromFolder = ?");
          values.push(null);
        }

        if (targetFolder === "Flagged") {
          fields.push("isFlagged = ?");
          values.push(1);
          fields.push("isJunk = ?");
          values.push(0);
        } else if (targetFolder === "Junk") {
          fields.push("isJunk = ?");
          values.push(1);
          fields.push("isFlagged = ?");
          values.push(0);
        } else {
          fields.push("isFlagged = ?");
          values.push(0);
          fields.push("isJunk = ?");
          values.push(0);
        }

        if (targetFolder === "Drafts") {
          fields.push("isDraft = ?");
          values.push(1);
        } else {
          fields.push("isDraft = ?");
          values.push(0);
        }

        await updateEmailRowById(id, fields, values);
        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error moving email:", err);
        return res.status(500).json({ error: "Failed to move email" });
      }
    },

    async deleteEmail(req, res) {
      try {
        const id = req.params.id;
        const email = await getEmailRowById(id);

        if (!email) {
          return res.status(404).json({ error: "Email not found" });
        }

        // Permanently delete if already in Deleted
        if (email.folder === "Deleted") {
          await deleteEmailRowById(id);
          return res.json({
            success: true,
            deletedPermanently: true,
            id: Number(id),
          });
        }

        const currentFolder = email.folder || "Inbox";

        await updateEmailRowById(
          id,
          [
            "folder = ?",
            "deletedFromFolder = ?",
            "isFlagged = ?",
            "isJunk = ?",
            "isDraft = ?",
          ],
          ["Deleted", currentFolder, 0, 0, 0]
        );

        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error deleting email:", err);
        return res.status(500).json({ error: "Failed to delete email" });
      }
    },

    async restoreEmail(req, res) {
      try {
        const id = req.params.id;
        const email = await getEmailRowById(id);

        if (!email) {
          return res.status(404).json({ error: "Email not found" });
        }

        if (email.folder !== "Deleted") {
          return res
            .status(400)
            .json({ error: "Only deleted emails can be restored" });
        }

        const restoreFolder = email.deletedFromFolder || "Inbox";

        const fields = ["folder = ?", "deletedFromFolder = ?"];
        const values = [restoreFolder, null];

        if (restoreFolder === "Flagged") {
          fields.push("isFlagged = ?");
          values.push(1);
          fields.push("isJunk = ?");
          values.push(0);
        } else if (restoreFolder === "Junk") {
          fields.push("isJunk = ?");
          values.push(1);
          fields.push("isFlagged = ?");
          values.push(0);
        } else {
          fields.push("isFlagged = ?");
          values.push(0);
          fields.push("isJunk = ?");
          values.push(0);
        }

        if (restoreFolder === "Drafts") {
          fields.push("isDraft = ?");
          values.push(1);
        } else {
          fields.push("isDraft = ?");
          values.push(0);
        }

        await updateEmailRowById(id, fields, values);
        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error restoring email:", err);
        return res.status(500).json({ error: "Failed to restore email" });
      }
    },
  };
}

module.exports = createEmailController;