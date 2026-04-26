const { extractFindings } = require("../../ai_rules");

describe("findings schema", () => {
  test("each finding has the expected structure", () => {
    const findings = extractFindings({
      sender: "alerts@test.com",
      subject: "Urgent action required",
      body: "Verify your account immediately at https://secure-login-bank.com",
    });

    findings.forEach((f) => {
      expect(f).toHaveProperty("field");
      expect(f).toHaveProperty("type");
      expect(f).toHaveProperty("severity");
      expect(f).toHaveProperty("reason");
      expect(f).toHaveProperty("text");
      expect(f).toHaveProperty("start");
      expect(f).toHaveProperty("end");
    });
  });
});