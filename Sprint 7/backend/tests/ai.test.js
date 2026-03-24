const { extractFindings } = require("../ai");

describe("extractFindings", () => {
  test("detects urgency language", () => {
    const email = {
      sender: "test@example.com",
      subject: "Urgent action required",
      body: "Please verify your account immediately."
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "urgency")).toBe(true);
  });

  test("detects credential request", () => {
    const email = {
      sender: "security@test.com",
      subject: "Security alert",
      body: "Please verify your account now."
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "credential_request")).toBe(true);
  });

  test("detects suspicious link keywords", () => {
    const email = {
      sender: "alert@test.com",
      subject: "Account warning",
      body: "Click here: https://secure-login-bank.com/verify"
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "suspicious_link")).toBe(true);
  });

  test("benign email returns no findings", () => {
    const email = {
      sender: "prof@uni.ac.uk",
      subject: "Lecture update",
      body: "The lecture has moved to Friday at 10am."
    };

    const findings = extractFindings(email);

    expect(findings.length).toBe(0);
  });

  test("detects sender/domain mismatch for trusted brand impersonation", () => {
    const email = {
      sender: "CNN.com Daily Top 10 <geips1955@mpls.k12.mn.us>",
      subject: "CNN.com Daily Top 10",
      body: "Read the latest headlines from CNN at http://www.cnn.com"
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "sender_mismatch")).toBe(true);
  });

  test("detects reward and promotional bait language", () => {
    const email = {
      sender: "karoly chungyen <lenore@mac.com>",
      subject: "Fw: Get our bonus for your feeling well!!!",
      body: "Receive our grant to feel well!"
    };

    const findings = extractFindings(email);

    expect(findings.some((f) => f.type === "reward_bait")).toBe(true);
    expect(findings.some((f) => f.type === "hype_punctuation")).toBe(true);
  });
});