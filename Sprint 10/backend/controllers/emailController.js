// backend/controllers/emailController.js

const { chooseIncomingFolderFromAI } = require("../emailRouting");

/**
 * Handles the main local email workflow for the application.
 *
 * This controller loads emails, manages folders, creates drafts, sends local
 * test emails, restores deleted messages, and keeps folder-specific flags in
 * sync. Where email content enters the system, the AI result is stored with the
 * email so the frontend can show the classification, score, findings, and
 * explanation to the user.
 */
// Builds the main email controller using the database and AI services.
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

  //  Database 

  // Finds one email by its database ID.
  function getEmailRowById(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM emails WHERE id = ?", [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  // Finds all emails that belong to the same conversation thread.
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

  // Updates selected fields on one email record.
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

  // Permanently removes one email from the database.
  function deleteEmailRowById(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM emails WHERE id = ?", [id], function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  }

  // Runs a database query that returns multiple rows.
  function runAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  // Runs a database query that returns one row.
  function runGet(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  // Promisifies the insertEmail callback so it can be awaited.
  function insertEmailAsync(emailData) {
    return new Promise((resolve, reject) => {
      insertEmail(emailData, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  //  Shared functions 

  // Reloads an email after a change and sends it back to the frontend.
  async function returnEmailById(id, res) {
    const row = await getEmailRowById(id);

    if (!row) {
      return res.status(404).json({ error: "Email not found" });
    }

    return res.json(mapEmailRow(row));
  }

  // Creates a simple unique thread ID for new conversations.
  function makeThreadId(seed = "new") {
    return `thread-${seed}-${Date.now()}`;
  }

  // Runs AI classification, but returns null if the model check fails.
  async function buildAIResult({ sender, subject, body }) {
    try {
      return await classifyEmailWithAI({ sender, subject, body: body || "" });
    } catch (err) {
      console.error("AI classification failed:", err);
      return null;
    }
  }

  /**
   * Returns the folder-specific flag fields and values for a target folder.
   * Centralises the isFlagged / isJunk / isDraft / deletedFromFolder logic
   * that was previously duplicated across moveEmail, restoreEmail, and updateEmail.
   *
   * @param {string} targetFolder - The folder being moved into.
   * @param {string|null} [previousFolder] - The folder the email is leaving
   *   (only needed when targetFolder === "Deleted" to record deletedFromFolder).
   * @returns {{ fields: string[], values: any[] }}
   */
  function getFolderFlags(targetFolder, previousFolder = null) {
    const fields = [];
    const values = [];

    // Track where a deleted email came from so it can be restored later.
    fields.push("deletedFromFolder = ?");
    values.push(targetFolder === "Deleted" ? previousFolder || "Inbox" : null);

    // Mutually exclusive flag pair: only one of Flagged / Junk can be active.
    if (targetFolder === "Flagged") {
      fields.push("isFlagged = ?", "isJunk = ?");
      values.push(1, 0);
    } else if (targetFolder === "Junk") {
      fields.push("isJunk = ?", "isFlagged = ?");
      values.push(1, 0);
    } else {
      fields.push("isFlagged = ?", "isJunk = ?");
      values.push(0, 0);
    }

    // isDraft is only true inside the Drafts folder.
    fields.push("isDraft = ?");
    values.push(targetFolder === "Drafts" ? 1 : 0);

    return { fields, values };
  }

  /**
   * Builds a base email insert payload with sensible defaults, then merges in
   * the provided overrides. Avoids repeating the full field list for every
   * insertEmailAsync call.
   *
   * @param {object} overrides - Any fields that differ from the defaults.
   * @returns {object}
   */
  function buildEmailData(overrides) {
    return {
      folder: "Inbox",
      sender: "",
      toRecipients: "",
      ccRecipients: "",
      bccRecipients: "",
      subject: "",
      body: "",
      date: getNowDateString(),
      groupLabel: "Today",
      isUnread: false,
      isFlagged: false,
      isPinned: false,
      isDraft: false,
      isJunk: false,
      deletedFromFolder: null,
      replyToId: null,
      threadId: null,
      urls: 0,
      groundTruthLabel: null,
      sourceDataset: null,
      aiLabel: null,
      aiScore: null,
      aiModel: null,
      aiExplanation: null,
      findings: [],
      ...overrides,
    };
  }

  // Converts an aiResult object into the AI-specific fields used by buildEmailData.
  function aiFields(aiResult) {
    return {
      aiLabel: aiResult?.aiLabel || null,
      aiScore: aiResult?.aiScore ?? null,
      aiModel: aiResult?.aiModel || null,
      aiExplanation: aiResult?.aiExplanation || null,
      findings: aiResult?.findings || [],
    };
  }

  //  Controller 

  return {
    // Loads emails from a folder and applies the search filter when one is provided.
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

    // Counts emails by folder and AI label for the sidebar and dashboard.
    async getFolderCounts(req, res) {
      try {
        // Run all folder counts in parallel.
        const folderRows = await Promise.all(
          VALID_FOLDERS.map((folder) =>
            runGet("SELECT COUNT(*) as count FROM emails WHERE folder = ?", [
              folder,
            ])
          )
        );

        const counts = Object.fromEntries(
          VALID_FOLDERS.map((folder, i) => [folder, folderRows[i]?.count || 0])
        );

        // Fetch the remaining aggregate counts in parallel.
        const [totalRow, phishingRow, benignRow] = await Promise.all([
          runGet("SELECT COUNT(*) as count FROM emails"),
          runGet(
            "SELECT COUNT(*) as count FROM emails WHERE aiLabel = 'phishing'"
          ),
          runGet(
            "SELECT COUNT(*) as count FROM emails WHERE aiLabel = 'benign'"
          ),
        ]);

        counts.Total = totalRow?.count || 0;
        counts.Phishing = phishingRow?.count || 0;
        counts.Benign = benignRow?.count || 0;

        res.json(counts);
      } catch (err) {
        console.error("Error getting folder counts:", err);
        res.status(500).json({ error: "Failed to fetch folder counts" });
      }
    },

    // Loads the full details for one selected email.
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

    // Loads the conversation thread for the selected email.
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

    // Alias kept so the router can call either createEmail or sendEmail.
    async createEmail(req, res) {
      return this.sendEmail(req, res);
    },

    // Sends a local email, classifies it, and creates both sent and received copies.
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

        const aiResult = await buildAIResult({ sender, subject, body });
        const incomingDecision = chooseIncomingFolderFromAI(aiResult);

        // Shared fields for both the sent and received copies.
        const sharedFields = {
          sender,
          toRecipients,
          ccRecipients: ccRecipients || "",
          bccRecipients: bccRecipients || "",
          subject,
          body: body || "",
          replyToId: replyToId || null,
          threadId: outgoingThreadId,
          ...aiFields(aiResult),
        };

        // Insert both copies concurrently.
        const [sentRow] = await Promise.all([
          insertEmailAsync(
            buildEmailData({
              ...sharedFields,
              folder: "Sent",
              isUnread: false,
            })
          ),
          insertEmailAsync(
            buildEmailData({
              ...sharedFields,
              folder: incomingDecision.folder,
              isUnread: true,
              isFlagged: incomingDecision.isFlagged,
              isJunk: incomingDecision.isJunk,
            })
          ),
        ]);

        res.status(201).json(mapEmailRow(sentRow));
      } catch (err) {
        console.error("Unexpected error sending email:", err);
        res.status(500).json({ error: "Failed to send email" });
      }
    },

    // Saves an unfinished email so the user can return to it later.
    async createDraft(req, res) {
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

        const row = await insertEmailAsync(
          buildEmailData({
            folder: "Drafts",
            sender: sender || "ben@example.com",
            toRecipients: toRecipients || "",
            ccRecipients: ccRecipients || "",
            bccRecipients: bccRecipients || "",
            subject: subject || "",
            body: body || "",
            isDraft: true,
            replyToId: replyToId || null,
            threadId: threadId || makeThreadId("draft"),
          })
        );

        res.status(201).json(mapEmailRow(row));
      } catch (err) {
        console.error("Error creating draft:", err);
        res.status(500).json({ error: "Failed to create draft" });
      }
    },

    // Updates a saved draft while blocking edits to non-draft emails.
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

        const { sender, toRecipients, ccRecipients, bccRecipients, subject, body } =
          req.body || {};

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

    // Updates simple email states such as unread, pinned, flagged, or folder.
    async updateEmail(req, res) {
      try {
        const id = req.params.id;
        const { isUnread, isFlagged, isPinned, folder } = req.body || {};

        const fields = [];
        const values = [];

        if (typeof isUnread === "boolean") {
          fields.push("isUnread = ?");
          values.push(isUnread ? 1 : 0);
        }

        if (typeof isPinned === "boolean") {
          fields.push("isPinned = ?");
          values.push(isPinned ? 1 : 0);
        }

        if (typeof isFlagged === "boolean") {
          // Toggling the flag also moves the email to/from the Flagged folder.
          const targetFolder = isFlagged ? "Flagged" : "Inbox";
          const { fields: flagFields, values: flagValues } =
            getFolderFlags(targetFolder);

          fields.push("folder = ?", ...flagFields);
          values.push(targetFolder, ...flagValues);
        } else if (typeof folder === "string" && folder.trim()) {
          const targetFolder = folder.trim();

          if (!VALID_FOLDERS.includes(targetFolder)) {
            return res.status(400).json({ error: "Invalid folder" });
          }

          const { fields: flagFields, values: flagValues } =
            getFolderFlags(targetFolder);

          fields.push("folder = ?", ...flagFields);
          values.push(targetFolder, ...flagValues);
        }

        if (!fields.length) {
          return res.status(400).json({ error: "No valid fields provided" });
        }

        await updateEmailRowById(id, fields, values);
        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error updating email:", err);
        return res.status(500).json({ error: "Failed to update email" });
      }
    },

    // Moves an email to another folder and keeps the related flags consistent.
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

        const { fields, values } = getFolderFlags(
          targetFolder,
          email.folder || "Inbox"
        );

        await updateEmailRowById(
          id,
          ["folder = ?", ...fields],
          [targetFolder, ...values]
        );

        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error moving email:", err);
        return res.status(500).json({ error: "Failed to move email" });
      }
    },

    // Moves an email to Deleted, or deletes it permanently if it is already there.
    async deleteEmail(req, res) {
      try {
        const id = req.params.id;
        const email = await getEmailRowById(id);

        if (!email) {
          return res.status(404).json({ error: "Email not found" });
        }

        // Permanently delete if already in Deleted.
        if (email.folder === "Deleted") {
          await deleteEmailRowById(id);
          return res.json({ success: true, deletedPermanently: true, id: Number(id) });
        }

        const { fields, values } = getFolderFlags(
          "Deleted",
          email.folder || "Inbox"
        );

        await updateEmailRowById(
          id,
          ["folder = ?", ...fields],
          ["Deleted", ...values]
        );

        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error deleting email:", err);
        return res.status(500).json({ error: "Failed to delete email" });
      }
    },

    // Restores a deleted email back to the folder it came from.
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

        const { fields, values } = getFolderFlags(restoreFolder);

        await updateEmailRowById(
          id,
          ["folder = ?", ...fields],
          [restoreFolder, ...values]
        );

        return returnEmailById(id, res);
      } catch (err) {
        console.error("Error restoring email:", err);
        return res.status(500).json({ error: "Failed to restore email" });
      }
    },
  };
}

module.exports = createEmailController;
