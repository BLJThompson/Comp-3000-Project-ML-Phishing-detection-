// backend/scripts/import_ceas_08.js
// Usage: node scripts/import_ceas_08.js

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../db");

const ceasPath = path.join(__dirname, "..", "data", "CEAS_08.csv");

console.log("[import_ceas_08] Using file:", ceasPath);

if (!fs.existsSync(ceasPath)) {
  console.error("[import_ceas_08] ERROR: CEAS_08.csv not found at:", ceasPath);
  console.error("Create folder backend/data and put CEAS_08.csv in there.");
  process.exit(1);
}

let total = 0;
let normalCount = 0;
let phishCount = 0;
let skipped = 0;
let headerKeys = null;

db.serialize(() => {
  // Clear old corpus data
  db.run("DELETE FROM normal_corpus");
  db.run("DELETE FROM phish_corpus");

  const insertNormal = db.prepare(
    "INSERT INTO normal_corpus (sender, subject, body, urls) VALUES (?, ?, ?, ?)"
  );
  const insertPhish = db.prepare(
    "INSERT INTO phish_corpus (sender, subject, body, urls) VALUES (?, ?, ?, ?)"
  );

  fs.createReadStream(ceasPath)
    .pipe(
      csv({
        separator: ",",            // CEAS_08 is standard CSV
        mapHeaders: ({ header }) => header.trim(),
      })
    )
    .on("data", (row) => {
      total++;

      if (!headerKeys) {
        headerKeys = Object.keys(row);
        console.log("[import_ceas_08] Detected columns:", headerKeys);

        if (headerKeys.length < 7) {
          console.error(
            "[import_ceas_08] Expected at least 7 columns (sender..urls). " +
              "Got " +
              headerKeys.length +
              ". Is the separator correct?"
          );
        }
      }

      if (!headerKeys || headerKeys.length < 7) {
        skipped++;
        return;
      }

      // Rely on column positions:
      // 0: sender, 3: subject, 4: body, 5: label, 6: urls
      const senderKey = headerKeys[0];
      const subjectKey = headerKeys[3];
      const bodyKey = headerKeys[4];
      const labelKey = headerKeys[5];
      const urlsKey = headerKeys[6];

      const sender = (row[senderKey] || "").toString();
      const subject = (row[subjectKey] || "").toString();
      const body = (row[bodyKey] || "").toString();
      const labelRaw = (row[labelKey] || "").toString().trim();
      const urlsRaw = row[urlsKey];

      // Interpret label: numeric or text
      let isPhish;
      const labelNum = parseFloat(labelRaw);
      if (!Number.isNaN(labelNum)) {
        // In CEAS_08, 1 = phishing/spam, 0 = normal
        isPhish = labelNum >= 0.5;
      } else {
        const lower = labelRaw.toLowerCase();
        if (["spam", "phish", "phishing"].includes(lower)) {
          isPhish = true;
        } else if (["ham", "legit", "benign"].includes(lower)) {
          isPhish = false;
        } else {
          skipped++;
          return;
        }
      }

      // urls column: treat >0 as "has URL(s)"
      let urlsFlag = 0;
      if (urlsRaw !== undefined && urlsRaw !== null && urlsRaw !== "") {
        const uNum = parseFloat(urlsRaw);
        if (!Number.isNaN(uNum) && uNum > 0) {
          urlsFlag = 1;
        }
      }

      if (isPhish) {
        insertPhish.run(sender, subject, body, urlsFlag);
        phishCount++;
      } else {
        insertNormal.run(sender, subject, body, urlsFlag);
        normalCount++;
      }
    })
    .on("end", () => {
      insertNormal.finalize();
      insertPhish.finalize();
      console.log("[import_ceas_08] Done.");
      console.log("  Total rows read:         ", total);
      console.log("  normal_corpus inserts:   ", normalCount);
      console.log("  phish_corpus inserts:    ", phishCount);
      console.log("  skipped (unknown label): ", skipped);
      db.close();
    })
    .on("error", (err) => {
      console.error("[import_ceas_08] ERROR while reading CSV:", err);
      db.close();
    });
});
