function expectEmailShape(email) {
  expect(email).toBeDefined();
  expect(typeof email).toBe("object");
  expect(email).toHaveProperty("id");
  expect(email).toHaveProperty("sender");
  expect(email).toHaveProperty("subject");
  expect(email).toHaveProperty("body");
  expect(email).toHaveProperty("folder");
}

function expectAiShape(payload) {
  expect(payload).toBeDefined();
  expect(typeof payload).toBe("object");
  expect(payload).toHaveProperty("aiLabel");
  expect(payload).toHaveProperty("aiScore");
  expect(payload).toHaveProperty("aiModel");
  expect(payload).toHaveProperty("findings");
  expect(Array.isArray(payload.findings)).toBe(true);

  if (typeof payload.aiScore === "number") {
    expect(payload.aiScore).toBeGreaterThanOrEqual(0);
    expect(payload.aiScore).toBeLessThanOrEqual(1);
  }
}

function expectStatusIn(actual, expected) {
  expect(expected).toContain(actual);
}

module.exports = {
  expectEmailShape,
  expectAiShape,
  expectStatusIn,
};
