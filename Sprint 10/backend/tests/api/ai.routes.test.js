jest.mock("../../ai", () => ({
  classifyEmailWithAI: jest.fn(async () => ({
    aiLabel: "phishing",
    aiScore: 0.91,
    aiModel: "mock-model",
    aiExplanation: "This email looks suspicious because it asks for urgent account verification.",
    explanationSource: "local",
    findings: [
      {
        field: "body",
        type: "credential_request",
        severity: "high",
        reason: "Requests account credentials or account verification.",
        text: "verify your account",
        start: 0,
        end: 19,
      },
    ],
  })),
}));

const request = require("supertest");
const app = require("../../app");

jest.setTimeout(15000);

describe("AI routes", () => {
  test("POST /api/ai/classify returns full AI response", async () => {
    const res = await request(app).post("/api/ai/classify").send({
      sender: "security@test.com",
      subject: "Urgent account alert",
      body: "Verify your account immediately",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("aiLabel");
    expect(res.body).toHaveProperty("aiScore");
    expect(res.body).toHaveProperty("aiModel");
    expect(res.body).toHaveProperty("aiExplanation");
    expect(res.body).toHaveProperty("explanationSource");
    expect(res.body).toHaveProperty("findings");
    expect(Array.isArray(res.body.findings)).toBe(true);
  });

  test("POST /api/ai/classify rejects missing sender", async () => {
    const res = await request(app).post("/api/ai/classify").send({
      subject: "Urgent account alert",
      body: "Verify your account immediately",
    });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/ai/classify rejects missing subject", async () => {
    const res = await request(app).post("/api/ai/classify").send({
      sender: "security@test.com",
      body: "Verify your account immediately",
    });

    expect(res.statusCode).toBe(400);
  });
});