// backend/scripts/import_datasets.js

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../db");

const CEAS_PATH = path.join(__dirname, "..", "data", "CEAS_08.csv");
const PHISHING_PATH = path.join(__dirname, "..", "data", "Phishing_Email.csv");

console.log("[IMPORT] Starting dataset import...");
console.log("[IMPORT] CEAS_08 path:", CEAS_PATH);
console.log("[IMPORT] Phishing_Email path:", PHISHING_PATH);

if (!fs.existsSync(CEAS_PATH)) {
  console.error("[IMPORT] ERROR: CEAS_08.csv not found");
  process.exit(1);
}

if (!fs.existsSync(PHISHING_PATH)) {
  console.error("[IMPORT] ERROR: Phishing_Email.csv not found");
  process.exit(1);
}

function mapPhishingLabel(label) {
  const l = (label || "").toString().trim().toLowerCase();

  if (["phishing email", "phishing", "spam", "phish", "1"].includes(l)) {
    return 1;
  }

  if (["safe email", "safe", "legitimate", "ham", "normal", "0"].includes(l)) {
    return 0;
  }

  return null;
}

function importCEAS(insertNormal, insertPhish) {
  return new Promise((resolve, reject) => {
    let headers = null;
    let rowsRead = 0;
    let insertedNormal = 0;
    let insertedPhish = 0;
    let skipped = 0;

    fs.createReadStream(CEAS_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
        })
      )
      .on("data", (row) => {
        rowsRead++;

        if (!headers) {
          headers = Object.keys(row);
          console.log("[CEAS] Detected columns:", headers);
        }

        // Based on your CEAS file structure
        const sender = (row["sender"] || "").toString().trim();
        const subject = (row["subject"] || "").toString().trim();
        const body = (row["body"] || "").toString().trim();
        const labelRaw = row["label"];
        const urlsRaw = row["urls"];

        if (!body) {
          skipped++;
          return;
        }

        let label = null;

        // numeric labels
        const labelNum = parseFloat(labelRaw);
        if (!Number.isNaN(labelNum)) {
          label = labelNum >= 0.5 ? 1 : 0;
        } else {
          label = mapPhishingLabel(labelRaw);
        }

        if (label === null) {
          skipped++;
          return;
        }

        let urls = 0;
        const urlsNum = parseFloat(urlsRaw);
        if (!Number.isNaN(urlsNum) && urlsNum > 0) {
          urls = 1;
        }

        if (label === 1) {
          insertPhish.run(sender, subject, body, urls);
          insertedPhish++;
        } else {
          insertNormal.run(sender, subject, body, urls);
          insertedNormal++;
        }
      })
      .on("end", () => {
        console.log("[CEAS] Import complete");
        console.log("[CEAS] Rows read:", rowsRead);
        console.log("[CEAS] Inserted normal:", insertedNormal);
        console.log("[CEAS] Inserted phishing:", insertedPhish);
        console.log("[CEAS] Skipped:", skipped);
        resolve();
      })
      .on("error", reject);
  });
}

function importPhishingEmail(insertNormal, insertPhish) {
  return new Promise((resolve, reject) => {
    let rowsRead = 0;
    let insertedNormal = 0;
    let insertedPhish = 0;
    let skipped = 0;

    fs.createReadStream(PHISHING_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
        })
      )
      .on("data", (row) => {
        rowsRead++;

        const body = (row["Email Text"] || "").toString().trim();
        const label = mapPhishingLabel(row["Email Type"]);

        if (!body || label === null) {
          skipped++;
          return;
        }

        const sender = "";
        const subject = "";
        const urls = /(http:\/\/|https:\/\/|www\.|click here|verify|login|account)/i.test(body)
          ? 1
          : 0;

        if (label === 1) {
          insertPhish.run(sender, subject, body, urls);
          insertedPhish++;
        } else {
          insertNormal.run(sender, subject, body, urls);
          insertedNormal++;
        }
      })
      .on("end", () => {
        console.log("[Phishing_Email] Import complete");
        console.log("[Phishing_Email] Rows read:", rowsRead);
        console.log("[Phishing_Email] Inserted normal:", insertedNormal);
        console.log("[Phishing_Email] Inserted phishing:", insertedPhish);
        console.log("[Phishing_Email] Skipped:", skipped);
        resolve();
      })
      .on("error", reject);
  });
}

db.serialize(() => {
  console.log("[IMPORT] Clearing existing tables...");

  db.run("DELETE FROM normal_corpus");
  db.run("DELETE FROM phish_corpus");
  db.run("DELETE FROM emails");

  db.run("DELETE FROM sqlite_sequence WHERE name = 'normal_corpus'");
  db.run("DELETE FROM sqlite_sequence WHERE name = 'phish_corpus'");
  db.run("DELETE FROM sqlite_sequence WHERE name = 'emails'");

  const insertNormal = db.prepare(
    "INSERT INTO normal_corpus (sender, subject, body, urls) VALUES (?, ?, ?, ?)"
  );

  const insertPhish = db.prepare(
    "INSERT INTO phish_corpus (sender, subject, body, urls) VALUES (?, ?, ?, ?)"
  );

  (async () => {
    try {
      await importCEAS(insertNormal, insertPhish);
      await importPhishingEmail(insertNormal, insertPhish);

      insertNormal.finalize();
      insertPhish.finalize();

      console.log("[IMPORT] Completed successfully");
      db.close();
    } catch (err) {
      console.error("[IMPORT] ERROR:", err);
      insertNormal.finalize();
      insertPhish.finalize();
      db.close();
      process.exit(1);
    }
  })();
});