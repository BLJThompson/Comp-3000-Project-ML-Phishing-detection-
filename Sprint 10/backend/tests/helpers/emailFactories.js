function phishingEmail(overrides = {}) {
  return {
    sender: "security@test.com",
    toRecipients: "victim@example.com",
    subject: "Urgent action required",
    body: "Verify your account immediately at https://secure-login-bank.com/verify",
    ...overrides,
  };
}

function benignEmail(overrides = {}) {
  return {
    sender: "prof@uni.ac.uk",
    toRecipients: "student@uni.ac.uk",
    subject: "Lecture update",
    body: "The lecture has moved to Friday at 10am.",
    ...overrides,
  };
}

function draftEmail(overrides = {}) {
  return {
    sender: "draft@example.com",
    toRecipients: "person@example.com",
    subject: "Draft subject",
    body: "Draft body",
    ...overrides,
  };
}

module.exports = {
  phishingEmail,
  benignEmail,
  draftEmail,
};
