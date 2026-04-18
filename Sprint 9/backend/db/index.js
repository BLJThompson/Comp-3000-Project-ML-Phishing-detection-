// backend/db/index.js

const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { applyEmailSchema } = require("./schema");

const dbPath = path.join(__dirname, "..", "mail.db");
const db = new sqlite3.Database(dbPath);

applyEmailSchema(db);

module.exports = db;