// backend/routes/gmailRoutes.js

const express = require("express");
const createGmailController = require("../controllers/gmailController");

function gmailRoutes(deps) {
  const router = express.Router();
  const controller = createGmailController(deps);

  router.get("/auth-url", controller.getAuthUrl);
  router.post("/auth-code", controller.saveAuthCode);
  router.post("/import-unread", controller.importUnread);
  router.post("/send", controller.sendViaGmail);

  return router;
}

module.exports = gmailRoutes;
