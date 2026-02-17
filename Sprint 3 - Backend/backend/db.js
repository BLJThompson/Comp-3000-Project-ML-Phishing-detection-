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
      body TEXT NOT NULL
    )`
  );

  // Corpus of phishing emails for spawning / ML
  db.run(
    `CREATE TABLE IF NOT EXISTS phish_corpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL
    )`
  );

  // --- Seed corpora ONLY if empty (emails table stays empty) ---

  db.get("SELECT COUNT(*) AS count FROM normal_corpus", (err, row) => {
    if (err) {
      console.error("Error counting normal_corpus:", err);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding normal_corpus with sample emails...");

      const insertNormal = db.prepare(
        `INSERT INTO normal_corpus (sender, subject, body) VALUES (?, ?, ?)`
      );

      insertNormal.run(
        "Newsletter <news@securityweekly.com>",
        "5 tips to secure your online accounts",
        `Hi,

Here are five quick ways to improve your online security:

1. Enable multi-factor authentication on important accounts
2. Use a password manager
3. Avoid reusing passwords
4. Keep your software up to date
5. Be cautious with links and attachments

Regards,
Security Weekly`
      );

      insertNormal.run(
        "Timetable <noreply@plymouth.ac.uk>",
        "Updated lecture timetable",
        `Dear student,

Your lecture timetable has been updated for next week. 
Please log in to the student portal to view the latest schedule.

Kind regards,
Student Services`
      );

      insertNormal.run(
        "Library <library@plymouth.ac.uk>",
        "Reminder: Library books due soon",
        `Dear Benjamin,

You have library items due for return in the next 3 days. 
Please return or renew them online to avoid fines.

Regards,
Plymouth University Library`
      );

      insertNormal.finalize();
    }
  });

  db.get("SELECT COUNT(*) AS count FROM phish_corpus", (err, row) => {
    if (err) {
      console.error("Error counting phish_corpus:", err);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding phish_corpus with sample emails...");

      const insertPhish = db.prepare(
        `INSERT INTO phish_corpus (sender, subject, body) VALUES (?, ?, ?)`
      );

      insertPhish.run(
        "IT Support <it-support@plymouth-verify.com>",
        "URGENT: Verify your University account",
        `Dear user,

Your University account will be suspended within 24 hours unless you verify your details at the link below.

Please click the secure link and enter your username and password to confirm your identity:
http://plymouth-verify.com/login

Failure to act will result in the immediate suspension of your account.

Regards,
IT Support`
      );

      insertPhish.run(
        "Bank Alert <alerts@secure-banking.com>",
        "Suspicious login detected – action required",
        `Dear customer,

We have detected unusual activity on your bank account.
To protect your funds, please verify your identity immediately by logging in via the link below:

http://secure-banking-check.com/login

If you do not respond within 2 hours, your account will be locked.

Sincerely,
Security Department`
      );

      insertPhish.run(
        "HMRC Refund <refunds@hmrc-tax-gov.uk>",
        "You are eligible for a tax refund",
        `Dear taxpayer,

After the last annual calculation of your fiscal activity we have determined that you are eligible to receive a tax refund.

To submit your refund request, please fill in the form at the link below:
http://hmrc-tax-gov.uk.refund-portal.com

Your refund will be processed within 3–5 working days.

HM Revenue & Customs`
      );

      insertPhish.finalize();
    }
  });
});

module.exports = db;
