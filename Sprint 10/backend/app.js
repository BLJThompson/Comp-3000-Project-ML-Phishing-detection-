// backend/app.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");
const { classifyEmailWithAI } = require("./ai/classifier");
const { mapEmailRow, insertEmail, getNowDateString } = require("./db/emailStore");
const emailRoutes = require("./routes/emailRoutes");
const aiRoutes = require("./routes/aiRoutes");
const devRoutes = require("./routes/devRoutes");
const gmailRoutes = require("./routes/gmailRoutes");

const app = express();

// CORS_ORIGIN can be overridden in .env for staging or production.
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Shared dependencies injected into every route factory.
const sharedDeps = {
  db,
  classifyEmailWithAI,
  mapEmailRow,
  insertEmail,
  getNowDateString,
};

app.use("/api/emails", emailRoutes(sharedDeps));
app.use("/api/ai", aiRoutes(sharedDeps));
app.use("/api/dev", devRoutes(sharedDeps));
app.use("/api/gmail", gmailRoutes(sharedDeps));

module.exports = app;
