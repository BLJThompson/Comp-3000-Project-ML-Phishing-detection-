const request = require("supertest");
const app = require("../app");
const db = require("../db");

jest.setTimeout(30000);

describe("Sprint 8 API routes", () => {
  beforeAll((done) => {
    db.run("DELETE FROM emails", done);
  });

  beforeEach((done) => {
    db.run("DELETE FROM emails", done);
  });

  // Do NOT close the db here.
  // The app and async requests may still be using it.
  afterAll((done) => {
    db.run("DELETE FROM emails", done);
  });

  test("GET /api/emails returns 200 and an array", async () => {
    const res = await request(app).get("/api/emails?folder=Inbox");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/emails/send creates a sent copy", async () => {
    const res = await request(app)
      .post("/api/emails/send")
      .send({
        sender: "tester@example.com",
        toRecipients: "receiver@example.com",
        subject: "Test subject",
        body: "This is a test email",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.sender).toBe("tester@example.com");
    expect(res.body.toRecipients).toBe("receiver@example.com");
    expect(res.body.subject).toBe("Test subject");
    expect(res.body.folder).toBe("Sent");
  });

  test("sending an email also creates a local received copy", async () => {
    await request(app).post("/api/emails/send").send({
      sender: "tester@example.com",
      toRecipients: "receiver@example.com",
      subject: "Normal update",
      body: "This is a normal message",
    });

    const sentRes = await request(app).get("/api/emails?folder=Sent");
    const inboxRes = await request(app).get("/api/emails?folder=Inbox");
    const flaggedRes = await request(app).get("/api/emails?folder=Flagged");
    const junkRes = await request(app).get("/api/emails?folder=Junk");

    const totalCopies =
      sentRes.body.length +
      inboxRes.body.length +
      flaggedRes.body.length +
      junkRes.body.length;

    expect(sentRes.statusCode).toBe(200);
    expect(inboxRes.statusCode).toBe(200);
    expect(flaggedRes.statusCode).toBe(200);
    expect(junkRes.statusCode).toBe(200);
    expect(totalCopies).toBe(2);
    expect(sentRes.body.length).toBe(1);
  });

  test("GET /api/emails/:id returns inserted sent email", async () => {
    const createRes = await request(app)
      .post("/api/emails/send")
      .send({
        sender: "fetch@example.com",
        toRecipients: "target@example.com",
        subject: "Fetch me",
        body: "Stored email body",
      });

    const emailId = createRes.body.id;

    const res = await request(app).get(`/api/emails/${emailId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(emailId);
    expect(res.body.subject).toBe("Fetch me");
    expect(res.body.folder).toBe("Sent");
  });

  test("POST /api/emails/draft creates a draft", async () => {
    const res = await request(app)
      .post("/api/emails/draft")
      .send({
        sender: "draft@example.com",
        toRecipients: "person@example.com",
        subject: "Draft subject",
        body: "Draft body",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.folder).toBe("Drafts");
    expect(res.body.subject).toBe("Draft subject");
  });

  test("PATCH /api/emails/:id/draft updates a draft", async () => {
    const createRes = await request(app)
      .post("/api/emails/draft")
      .send({
        sender: "draft@example.com",
        toRecipients: "person@example.com",
        subject: "Old subject",
        body: "Old body",
      });

    const res = await request(app)
      .patch(`/api/emails/${createRes.body.id}/draft`)
      .send({
        subject: "New subject",
        body: "New body",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Drafts");
    expect(res.body.subject).toBe("New subject");
    expect(res.body.body).toBe("New body");
  });

  test("PATCH /api/emails/:id/delete moves email to Deleted", async () => {
    const createRes = await request(app)
      .post("/api/emails/draft")
      .send({
        sender: "delete@example.com",
        toRecipients: "target@example.com",
        subject: "Delete me",
        body: "Delete body",
      });

    const res = await request(app).patch(
      `/api/emails/${createRes.body.id}/delete`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Deleted");
  });

  test("PATCH /api/emails/:id/restore restores deleted email", async () => {
    const createRes = await request(app)
      .post("/api/emails/draft")
      .send({
        sender: "restore@example.com",
        toRecipients: "target@example.com",
        subject: "Restore me",
        body: "Restore body",
      });

    await request(app).patch(`/api/emails/${createRes.body.id}/delete`);

    const res = await request(app).patch(
      `/api/emails/${createRes.body.id}/restore`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Drafts");
  });

  test("PATCH /api/emails/:id/move moves email to Junk", async () => {
    const createRes = await request(app)
      .post("/api/emails/draft")
      .send({
        sender: "move@example.com",
        toRecipients: "target@example.com",
        subject: "Move me",
        body: "Move body",
      });

    const res = await request(app)
      .patch(`/api/emails/${createRes.body.id}/move`)
      .send({ folder: "Junk" });

    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Junk");
  });

  test("GET /api/emails/counts returns folder counts", async () => {
    await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      toRecipients: "person@example.com",
      subject: "Draft one",
      body: "Draft body",
    });

    const res = await request(app).get("/api/emails/counts");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("Inbox");
    expect(res.body).toHaveProperty("Drafts");
    expect(res.body).toHaveProperty("Sent");
    expect(res.body).toHaveProperty("Deleted");
    expect(res.body).toHaveProperty("Flagged");
    expect(res.body).toHaveProperty("Junk");
    expect(res.body).toHaveProperty("Total");
  });

  test("POST /api/ai/classify returns AI fields", async () => {
    const res = await request(app)
      .post("/api/ai/classify")
      .send({
        sender: "security@test.com",
        subject: "Urgent action required",
        body: "Verify your account immediately at https://secure-login-bank.com",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.aiLabel).toBeDefined();
    expect(res.body.aiScore).toBeDefined();
    expect(res.body.aiModel).toBeDefined();
    expect(Array.isArray(res.body.findings)).toBe(true);
  });
});