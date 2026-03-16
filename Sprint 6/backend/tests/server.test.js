const request = require("supertest");
const app = require("../server");
const db = require("../db");

describe("API routes", () => {
  beforeAll((done) => {
    db.run("DELETE FROM emails", done);
  });

  afterAll((done) => {
    db.close(done);
  });

  test("GET /api/emails returns 200", async () => {
    const res = await request(app).get("/api/emails");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/emails creates a sent email", async () => {
    const res = await request(app)
      .post("/api/emails")
      .send({
        sender: "tester@example.com",
        subject: "Test subject",
        body: "This is a test email"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.sender).toBe("tester@example.com");
    expect(res.body.subject).toBe("Test subject");
    expect(res.body.folder).toBe("Sent");
  });

  test("GET /api/emails/:id returns inserted email", async () => {
    const createRes = await request(app)
      .post("/api/emails")
      .send({
        sender: "fetch@example.com",
        subject: "Fetch me",
        body: "Stored email body"
      });

    const emailId = createRes.body.id;

    const res = await request(app).get(`/api/emails/${emailId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(emailId);
    expect(res.body.subject).toBe("Fetch me");
  });

  test("POST /api/ai/classify returns AI fields", async () => {
    const res = await request(app)
      .post("/api/ai/classify")
      .send({
        sender: "security@test.com",
        subject: "Urgent action required",
        body: "Verify your account immediately at https://secure-login-bank.com"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.aiLabel).toBeDefined();
    expect(res.body.aiScore).toBeDefined();
    expect(res.body.aiModel).toBeDefined();
    expect(Array.isArray(res.body.findings)).toBe(true);
  });
});