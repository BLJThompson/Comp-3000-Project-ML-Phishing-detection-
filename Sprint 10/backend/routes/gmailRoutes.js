// backend/routes/gmailRoutes.js

const express = require("express");

function createGmailRoutes(gmailController) {
  const router = express.Router();

  router.get("/auth-url", gmailController.getAuthUrl);
  router.post("/auth-code", gmailController.saveAuthCode);
  router.post("/import-unread", gmailController.importUnread);
  router.post("/send", gmailController.sendViaGmail);

  return router;
}

module.exports = createGmailRoutes;