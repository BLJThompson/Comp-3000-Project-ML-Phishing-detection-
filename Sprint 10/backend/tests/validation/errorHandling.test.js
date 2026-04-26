const request = require("supertest");
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

describe("validation and robustness checks", () => {
  beforeAll(async () => {
    await clearEmails();
  });

  beforeEach(async () => {
    await clearEmails();
  });

  afterAll(async () => {
    await clearEmails();
  });

  test("GET /api/emails with unknown folder returns controlled response", async () => {
    const res = await request(app).get("/api/emails?folder=NotARealFolder");
    expect([200, 500]).toContain(res.statusCode);
  });

  test("PATCH /api/emails/:id/delete returns 404 for unknown email", async () => {
    const res = await request(app).patch("/api/emails/999999/delete");
    expect(res.statusCode).toBe(404);
  });

  test("PATCH /api/emails/:id/restore returns 404 for unknown email", async () => {
    const res = await request(app).patch("/api/emails/999999/restore");
    expect(res.statusCode).toBe(404);
  });

  test("PATCH /api/emails/:id/move returns 404 for unknown email", async () => {
    const res = await request(app)
      .patch("/api/emails/999999/move")
      .send({ folder: "Junk" });

    expect(res.statusCode).toBe(404);
  });

  test("PATCH /api/emails/:id/draft returns 404 for unknown draft", async () => {
    const res = await request(app)
      .patch("/api/emails/999999/draft")
      .send({ subject: "Nope" });

    expect(res.statusCode).toBe(404);
  });

  test("POST /api/ai/classify rejects missing sender and subject", async () => {
    const res = await request(app).post("/api/ai/classify").send({
      body: "Verify your account immediately",
    });

    expect(res.statusCode).toBe(400);
  });
});