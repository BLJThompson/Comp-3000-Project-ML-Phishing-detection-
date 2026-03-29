// backend/controllers/aiController.js

function createAIController({ classifyEmailWithAI }) {
  return {
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