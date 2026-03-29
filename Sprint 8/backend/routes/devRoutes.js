// backend/routes/devRoutes.js

const express = require("express");
const createDevController = require("../controllers/devController");

function devRoutes(deps) {
  const router = express.Router();
  const controller = createDevController(deps);

  router.post("/spawn-email", controller.spawnEmail);
  router.post("/clear-inbox", controller.clearInbox);
  router.delete("/clear-flagged", controller.clearFlagged);
  router.post("/clear-all", controller.clearAllEmails);

  return router;
}

module.exports = devRoutes;