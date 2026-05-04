// backend/controllers/aiController.js

/**
 * Handles direct AI classification requests from the frontend.
 *
 * This controller is intentionally small: it receives email content, validates
 * the minimum required fields, passes the message to the AI pipeline, and sends
 * the classification result back to the interface.
 */
// Builds the controller for frontend AI classification requests.
function createAIController({ classifyEmailWithAI }) {
  return {
    // Classifies the email content submitted by the frontend.
    async classifyEmail(req, res) {
      try {
        const { sender, subject, body, urls } = req.body || {};

        if (!sender || !subject) {
          return res.status(400).json({
            error: "sender and subject are required for AI classification",
          });
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
    },
  };
}

module.exports = createAIController;