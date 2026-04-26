const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

jest.mock("../../ai", () => ({
  classifyEmailWithAI: jest.fn(async ({ subject, body }) => ({
    aiLabel:
      /urgent|verify|password|account|secure-login/i.test(`${subject} ${body}`)
        ? "phishing"
        : "benign",
    aiScore:
      /urgent|verify|password|account|secure-login/i.test(`${subject} ${body}`)
        ? 0.91
        : 0.22,
    aiModel: "mock-model",
    aiExplanation: "Mock explanation",
    explanationSource: "local",
    findings: [],
  })),
}));

function clearEmails() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM emails", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

jest.setTimeout(15000);

describe("email routes", () => {
  beforeAll(async () => {
    await clearEmails();
  });

  beforeEach(async () => {
    await clearEmails();
  });

  afterAll(async () => {
    await clearEmails();
  });

  test("GET /api/emails returns 200 and an array", async () => {
    const res = await request(app).get("/api/emails?folder=Inbox");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/emails/send creates a sent email", async () => {
    const res = await request(app).post("/api/emails/send").send({
      sender: "prof@uni.ac.uk",
      toRecipients: "student@uni.ac.uk",
      subject: "Lecture update",
      body: "The lecture has moved to Friday at 10am.",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.folder).toBe("Sent");
  });

  test("sending an email creates two copies total", async () => {
    await request(app).post("/api/emails/send").send({
      sender: "prof@uni.ac.uk",
      toRecipients: "student@uni.ac.uk",
      subject: "Lecture update",
      body: "The lecture has moved to Friday at 10am.",
    });

    const counts = await request(app).get("/api/emails/counts");
    expect(counts.statusCode).toBe(200);
    expect(counts.body.Total).toBe(2);
    expect(counts.body.Sent).toBe(1);
  });

  test("GET /api/emails/:id returns inserted email", async () => {
    const createRes = await request(app).post("/api/emails/send").send({
      sender: "fetch@example.com",
      toRecipients: "person@example.com",
      subject: "Fetch me",
      body: "Stored email body",
    });

    const res = await request(app).get(`/api/emails/${createRes.body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.folder).toBe("Sent");
  });

  test("POST /api/emails/draft creates a draft", async () => {
    const res = await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      toRecipients: "person@example.com",
      subject: "Draft subject",
      body: "Draft body",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.folder).toBe("Drafts");
  });

  test("PATCH /api/emails/:id/draft updates a draft", async () => {
    const createRes = await request(app).post("/api/emails/draft").send({
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
    expect(res.body.subject).toBe("New subject");
    expect(res.body.body).toBe("New body");
  });

  test("PATCH /api/emails/:id/delete moves an email to Deleted", async () => {
    const createRes = await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      subject: "Delete me",
      body: "Draft body",
    });

    const res = await request(app).patch(`/api/emails/${createRes.body.id}/delete`);
    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Deleted");
  });

  test("PATCH /api/emails/:id/restore restores a deleted email", async () => {
    const createRes = await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      subject: "Restore me",
      body: "Draft body",
    });

    await request(app).patch(`/api/emails/${createRes.body.id}/delete`);
    const res = await request(app).patch(`/api/emails/${createRes.body.id}/restore`);

    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Drafts");
  });

  test("PATCH /api/emails/:id/move moves an email to Junk", async () => {
    const createRes = await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      subject: "Move me",
      body: "Draft body",
    });

    const res = await request(app)
      .patch(`/api/emails/${createRes.body.id}/move`)
      .send({ folder: "Junk" });

    expect(res.statusCode).toBe(200);
    expect(res.body.folder).toBe("Junk");
  });

  test("GET /api/emails/counts returns expected keys", async () => {
    const res = await request(app).get("/api/emails/counts");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("Inbox");
    expect(res.body).toHaveProperty("Drafts");
    expect(res.body).toHaveProperty("Sent");
    expect(res.body).toHaveProperty("Deleted");
    expect(res.body).toHaveProperty("Flagged");
    expect(res.body).toHaveProperty("Junk");
    expect(res.body).toHaveProperty("Total");
    expect(res.body).toHaveProperty("Phishing");
    expect(res.body).toHaveProperty("Benign");
  });

  test("GET /api/emails/:id returns 404 for unknown email", async () => {
    const res = await request(app).get("/api/emails/999999");
    expect(res.statusCode).toBe(404);
  });

  test("PATCH /api/emails/:id/move rejects invalid folder", async () => {
    const createRes = await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      subject: "Move test",
      body: "Body",
    });

    const res = await request(app)
      .patch(`/api/emails/${createRes.body.id}/move`)
      .send({ folder: "NotARealFolder" });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/emails/send rejects missing required fields", async () => {
    const res = await request(app).post("/api/emails/send").send({
      sender: "tester@example.com",
      subject: "Missing recipient",
    });

    expect(res.statusCode).toBe(400);
  });
});