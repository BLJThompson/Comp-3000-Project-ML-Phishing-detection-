// backend/routes/devRoutes.js

const express = require("express");
const createDevController = require("../controllers/devController");

function devRoutes(deps) {
  const router = express.Router();
  const controller = createDevController(deps);

  router.post("/spawn-email", controller.spawnEmail);

  // All clear routes use DELETE — they are destructive with no request body.
  router.delete("/clear-inbox", controller.clearInbox);
  router.delete("/clear-flagged", controller.clearFlagged);
  router.delete("/clear-all", controller.clearAllEmails);

  return router;
}

module.exports = devRoutes;
