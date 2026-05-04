// backend/routes/emailRoutes.js

const express = require("express");
const createEmailController = require("../controllers/emailController");

function emailRoutes(deps) {
  const router = express.Router();
  const controller = createEmailController(deps);

  // Read
  router.get("/", controller.getEmails);
  router.get("/counts", controller.getFolderCounts);
  router.get("/:id", controller.getEmailById);
  router.get("/:id/thread", controller.getEmailThread);

  // Create
  router.post("/", controller.sendEmail);
  router.post("/send", controller.sendEmail);
  router.post("/draft", controller.createDraft);

  // Update
  router.patch("/:id", controller.updateEmail);
  router.patch("/:id/draft", controller.updateDraft);
  router.patch("/:id/move", controller.moveEmail);
  router.patch("/:id/delete", controller.deleteEmail);
  router.patch("/:id/restore", controller.restoreEmail);

  return router;
}

module.exports = emailRoutes;
