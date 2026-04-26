const request = require("supertest");

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

const app = require("../../app");
const db = require("../../db");

function clearEmails() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM emails", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

jest.setTimeout(15000);

describe("end-to-end application flows", () => {
  beforeAll(async () => {
    await clearEmails();
  });

  beforeEach(async () => {
    await clearEmails();
  });

  afterAll(async () => {
    await clearEmails();
  });

  test("full phishing workflow works end-to-end", async () => {
    const sendRes = await request(app).post("/api/emails/send").send({
      sender: "attacker@test.com",
      toRecipients: "victim@test.com",
      subject: "URGENT verify account",
      body: "Click here: https://secure-login-bank.com",
    });

    expect(sendRes.statusCode).toBe(201);
    expect(sendRes.body.folder).toBe("Sent");

    const classifyRes = await request(app).post("/api/ai/classify").send({
      sender: sendRes.body.sender,
      subject: sendRes.body.subject,
      body: sendRes.body.body,
    });

    expect(classifyRes.statusCode).toBe(200);
    expect(classifyRes.body.aiLabel).toBeDefined();

    const counts = await request(app).get("/api/emails/counts");
    expect(counts.statusCode).toBe(200);
    expect(counts.body.Total).toBe(2);
  });

  test("draft lifecycle works end-to-end", async () => {
    const createRes = await request(app).post("/api/emails/draft").send({
      sender: "draft@example.com",
      toRecipients: "person@example.com",
      subject: "Lifecycle subject",
      body: "Lifecycle body",
    });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.folder).toBe("Drafts");

    const updateRes = await request(app)
      .patch(`/api/emails/${createRes.body.id}/draft`)
      .send({ subject: "Updated subject", body: "Updated body" });

    expect(updateRes.statusCode).toBe(200);

    const deleteRes = await request(app).patch(`/api/emails/${createRes.body.id}/delete`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.folder).toBe("Deleted");

    const restoreRes = await request(app).patch(`/api/emails/${createRes.body.id}/restore`);
    expect(restoreRes.statusCode).toBe(200);
    expect(restoreRes.body.folder).toBe("Drafts");
  });
});