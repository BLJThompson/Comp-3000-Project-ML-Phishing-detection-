// backend/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbFile = path.join(__dirname, "mail.db");

// Open (or create) the database file
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  // Operational mailbox table (used by the app UI)
  db.run(
    `CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder TEXT NOT NULL,           -- 'Inbox' | 'Sent'
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT,
      date TEXT,
      groupLabel TEXT,                -- 'Today', 'This week', etc.
      isUnread INTEGER DEFAULT 1,     -- 1 = true, 0 = false
      isFlagged INTEGER DEFAULT 0,
      isPinned INTEGER DEFAULT 0,
      urls INTEGER DEFAULT 0,         -- 0 = no URL, >0 = has URL(s)
      groundTruthLabel TEXT,          -- 'benign' | 'phishing' | NULL
      sourceDataset TEXT              -- 'normal_corpus' | 'phish_corpus' | NULL
    )`
  );

  // Corpus of normal (benign) emails for spawning / ML
  db.run(
    `CREATE TABLE IF NOT EXISTS normal_corpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      urls INTEGER DEFAULT 0          -- 0/1 flag from CEAS_08
    )`
  );

  // Corpus of phishing emails for spawning / ML
  db.run(
    `CREATE TABLE IF NOT EXISTS phish_corpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      urls INTEGER DEFAULT 0          -- 0/1 flag from CEAS_08
    )`
  );
});

module.exports = db;
