jest.mock("child_process", () => ({
  spawn: () => {
    return {
      stdout: {
        on: (event, cb) => {
          if (event === "data") {
            setTimeout(() => {
              cb(
                JSON.stringify({
                  label: 1,
                  phishingScore: 0.82,
                  model: "mock-python-model",
                })
              );
            }, 10);
          }
        },
      },
      stderr: { on: () => {} },
      stdin: {
        write: () => {},
        end: () => {},
      },
      on: (event, cb) => {
        if (event === "close") {
          setTimeout(() => cb(0), 20);
        }
        if (event === "error") {
          // do nothing in success path
        }
      },
    };
  },
}));

jest.mock("../../llm", () => ({
  explainPhishingEmail: jest.fn(async () => null),
}));

const { classifyEmailWithAI } = require("../../ai");

jest.setTimeout(15000);

describe("AI pipeline", () => {
  test("classifies phishing-style email with expected shape", async () => {
    const result = await classifyEmailWithAI({
      sender: "security@test.com",
      subject: "Urgent account alert",
      body: "Verify your account immediately at https://secure-login-bank.com",
    });

    expect(result).toHaveProperty("aiLabel");
    expect(result).toHaveProperty("aiScore");
    expect(result).toHaveProperty("aiModel");
    expect(result).toHaveProperty("aiExplanation");
    expect(result).toHaveProperty("explanationSource");
    expect(result).toHaveProperty("findings");

    expect(["phishing", "benign"]).toContain(result.aiLabel);
    expect(result.aiScore).toBeGreaterThanOrEqual(0);
    expect(result.aiScore).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.findings)).toBe(true);
  });
});