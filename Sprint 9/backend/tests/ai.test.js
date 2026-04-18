const { extractFindings } = require("../ai");

describe("extractFindings", () => {
  test("detects urgency language", () => {
    const email = {
      sender: "test@example.com",
      subject: "Urgent action required",
      body: "Please verify your account immediately.",
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "urgency")).toBe(true);
  });

  test("detects credential request", () => {
    const email = {
      sender: "security@test.com",
      subject: "Security alert",
      body: "Please verify your account now.",
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "credential_request")).toBe(true);
  });

  test("detects suspicious link keywords", () => {
    const email = {
      sender: "alert@test.com",
      subject: "Account warning",
      body: "Click here: https://secure-login-bank.com/verify",
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "suspicious_link")).toBe(true);
  });

  test("benign email returns no findings", () => {
    const email = {
      sender: "prof@uni.ac.uk",
      subject: "Lecture update",
      body: "The lecture has moved to Friday at 10am.",
    };

    const findings = extractFindings(email);

    expect(findings.length).toBe(0);
  });
});