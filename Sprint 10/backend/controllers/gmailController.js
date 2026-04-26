// backend/controllers/gmailController.js

const {
  getAuthUrl,
  saveAuthCode,
  listUnreadMessageIds,
  getMessageById,
  markMessageAsRead,
  sendGmailMessage,
} = require("../google/gmailService");

const { chooseIncomingFolderFromAI } = require("../emailRouting");

function createGmailController({
  classifyEmailWithAI,
  insertEmail,
  mapEmailRow,
  getNowDateString,
}) {
  function insertEmailAsync(emailData) {
    return new Promise((resolve, reject) => {
      insertEmail(emailData, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async function classifySafely(email) {
    try {
      return await classifyEmailWithAI({
        sender: email.sender,
        subject: email.subject,
        body: email.body || "",
      });
    } catch (err) {
      console.error("Gmail email classification failed:", err);
      return null;
    }
  }

  return {
    async getAuthUrl(req, res) {
      try {
        const url = await getAuthUrl();
        return res.json({ url });
      } catch (err) {
        console.error("Error creating Gmail auth URL:", err);
        return res.status(500).json({
          error: "Failed to create Gmail auth URL",
          details: err.message,
        });
      }
    },

    async saveAuthCode(req, res) {
      try {
        const { code } = req.body || {};

        if (!code) {
          return res.status(400).json({
            error: "Google auth code is required",
          });
        }

        await saveAuthCode(code);

        return res.json({
          success: true,
          message: "Gmail authentication saved successfully",
        });
      } catch (err) {
        console.error("Error saving Gmail auth code:", err);
        return res.status(500).json({
          error: "Failed to save Gmail auth code",
          details: err.message,
        });
      }
    },

    async importUnread(req, res) {
      try {
        const maxResultsRaw = Number(req.query.maxResults || req.body?.maxResults);
        const maxResults =
          Number.isInteger(maxResultsRaw) && maxResultsRaw > 0
            ? Math.min(maxResultsRaw, 25)
            : 10;

        const messageRefs = await listUnreadMessageIds(maxResults);
        const imported = [];
        const skipped = [];

        for (const ref of messageRefs) {
          try {
            const gmailEmail = await getMessageById(ref.id);
            const aiResult = await classifySafely(gmailEmail);
            const routing = chooseIncomingFolderFromAI(aiResult);

            const insertedRow = await insertEmailAsync({
              folder: routing.folder,
              sender: gmailEmail.sender || "Unknown sender",
              toRecipients: gmailEmail.toRecipients || "",
              ccRecipients: gmailEmail.ccRecipients || "",
              bccRecipients: gmailEmail.bccRecipients || "",
              subject: gmailEmail.subject || "(No subject)",
              body: gmailEmail.body || "",
              date: getNowDateString(),
              groupLabel: "Today",
              isUnread: true,
              isFlagged: routing.isFlagged,
              isPinned: false,
              isDraft: false,
              isJunk: routing.isJunk,
              deletedFromFolder: null,
              threadId: `gmail-${gmailEmail.externalThreadId || gmailEmail.externalMessageId}`,
              replyToId: null,
              urls: gmailEmail.urls || 0,
              groundTruthLabel: null,
              sourceDataset: "live_email:gmail",
              aiLabel: aiResult?.aiLabel || null,
              aiScore: aiResult?.aiScore ?? null,
              aiModel: aiResult?.aiModel || null,
              aiExplanation: aiResult?.aiExplanation || null,
              findings: aiResult?.findings || [],
            });

            await markMessageAsRead(ref.id);

            imported.push(mapEmailRow(insertedRow));
          } catch (messageErr) {
            console.error("Failed to import Gmail message:", messageErr);

            skipped.push({
              gmailMessageId: ref.id,
              error: messageErr.message || "Unknown error",
            });
          }
        }

        return res.json({
          success: true,
          importedCount: imported.length,
          skippedCount: skipped.length,
          imported,
          skipped,
        });
      } catch (err) {
        console.error("Error importing unread Gmail messages:", err);
        return res.status(500).json({
          error: "Failed to import unread Gmail messages",
          details: err.message,
        });
      }
    },

    async sendViaGmail(req, res) {
      try {
        const {
          sender,
          toRecipients,
          ccRecipients,
          bccRecipients,
          subject,
          body,
          threadId,
          replyToId,
        } = req.body || {};

        if (!toRecipients || !subject) {
          return res.status(400).json({
            error: "toRecipients and subject are required",
          });
        }

        const gmailResult = await sendGmailMessage({
          from: sender || "",
          to: toRecipients,
          cc: ccRecipients || "",
          bcc: bccRecipients || "",
          subject,
          body: body || "",
        });

        const sentRow = await insertEmailAsync({
          folder: "Sent",
          sender: sender || "comp3000.phishing.detector@gmail.com",
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
          threadId: threadId || `gmail-sent-${gmailResult.id || Date.now()}`,
          replyToId: replyToId || null,
          urls: 0,
          groundTruthLabel: null,
          sourceDataset: "gmail_sent",
          aiLabel: null,
          aiScore: null,
          aiModel: null,
          aiExplanation: null,
          findings: [],
        });

        return res.status(201).json({
          success: true,
          gmailMessageId: gmailResult.id || null,
          email: mapEmailRow(sentRow),
        });
      } catch (err) {
        console.error("Error sending Gmail message:", err);
        return res.status(500).json({
          error: "Failed to send Gmail message",
          details: err.message,
        });
      }
    },
  };
}

module.exports = createGmailController;