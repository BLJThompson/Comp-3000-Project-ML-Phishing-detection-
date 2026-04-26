const { extractFindings } = require("../../ai_rules");

describe("extractFindings", () => {
  test("detects urgency language", () => {
    const findings = extractFindings({
      sender: "security@test.com",
      subject: "Security alert",
      body: "Please verify your account immediately.",
    });

    expect(findings.some((f) => f.type === "urgency")).toBe(true);
  });

  test("detects credential request language", () => {
    const findings = extractFindings({
      sender: "security@test.com",
      subject: "Security alert",
      body: "Please verify your account and confirm your password immediately.",
    });

    expect(findings.some((f) => f.type === "credential_request")).toBe(true);
  });

  test("detects suspicious links", () => {
    const findings = extractFindings({
      sender: "security@test.com",
      subject: "Account warning",
      body: "Click here: https://secure-login-bank.com/verify",
    });

    expect(findings.some((f) => f.type === "suspicious_link")).toBe(true);
  });

  test("returns array for benign email", () => {
    const findings = extractFindings({
      sender: "prof@uni.ac.uk",
      subject: "Lecture update",
      body: "The lecture has moved to Friday at 10am.",
    });

    expect(Array.isArray(findings)).toBe(true);
  });

  test("handles empty values without crashing", () => {
    const findings = extractFindings({
      sender: "",
      subject: "",
      body: "",
    });

    expect(Array.isArray(findings)).toBe(true);
  });
});