// backend/db/schema.js

function applyEmailSchema(db) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder TEXT DEFAULT 'Inbox',
        sender TEXT,
        toRecipients TEXT,
        ccRecipients TEXT,
        bccRecipients TEXT,
        subject TEXT,
        body TEXT,
        date TEXT,
        groupLabel TEXT,
        isUnread INTEGER DEFAULT 1,
        isFlagged INTEGER DEFAULT 0,
        isPinned INTEGER DEFAULT 0,
        isDraft INTEGER DEFAULT 0,
        isJunk INTEGER DEFAULT 0,
        deletedFromFolder TEXT,
        threadId TEXT,
        replyToId INTEGER,
        urls INTEGER DEFAULT 0,
        groundTruthLabel TEXT,
        sourceDataset TEXT,
        aiLabel TEXT,
        aiScore REAL,
        aiModel TEXT,
        aiExplanation TEXT,
        aiFindings TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const alterStatements = [
      "ALTER TABLE emails ADD COLUMN toRecipients TEXT",
      "ALTER TABLE emails ADD COLUMN ccRecipients TEXT",
      "ALTER TABLE emails ADD COLUMN bccRecipients TEXT",
      "ALTER TABLE emails ADD COLUMN isDraft INTEGER DEFAULT 0",
      "ALTER TABLE emails ADD COLUMN isJunk INTEGER DEFAULT 0",
      "ALTER TABLE emails ADD COLUMN deletedFromFolder TEXT",
      "ALTER TABLE emails ADD COLUMN threadId TEXT",
      "ALTER TABLE emails ADD COLUMN replyToId INTEGER",
      "ALTER TABLE emails ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE emails ADD COLUMN updatedAt TEXT DEFAULT CURRENT_TIMESTAMP",
    ];

    alterStatements.forEach((sql) => {
      db.run(sql, () => {});
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS normal_corpus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        subject TEXT,
        body TEXT,
        urls INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS phish_corpus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        subject TEXT,
        body TEXT,
        urls INTEGER DEFAULT 0
      )
    `);
  });
}

module.exports = { applyEmailSchema };