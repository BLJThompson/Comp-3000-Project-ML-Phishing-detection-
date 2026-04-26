// backend/routes/aiRoutes.js

const express = require("express");
const createAIController = require("../controllers/aiController");

function aiRoutes(deps) {
  const router = express.Router();
  const controller = createAIController(deps);

  router.post("/classify", controller.classifyEmail);

  return router;
}

module.exports = aiRoutes;