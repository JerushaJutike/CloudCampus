const test = require("node:test");
const assert = require("node:assert/strict");
const { signToken, verifyToken } = require("../src/utils/jwt");
const { validateRegistration } = require("../src/validators/auth");
const { levelFromXp } = require("../src/utils/xp");

test("registration validator rejects weak or malformed input", () => {
  assert.equal(
    validateRegistration({ name: "A", email: "not-email", password: "123" }) !==
      null,
    true,
  );
  assert.equal(
    validateRegistration({
      name: "Student",
      email: "student@example.com",
      password: "correct-horse-battery",
    }),
    null,
  );
});
test("JWT token verifies and carries only expected identity claims", () => {
  const user = {
    id: 42,
    name: "Test",
    email: "test@example.com",
    role: "student",
  };
  const token = signToken(user);
  const decoded = verifyToken(token);
  assert.equal(decoded.id, 42);
  assert.equal(decoded.email, user.email);
  assert.equal(decoded.role, user.role);
  assert.equal("name" in decoded, false);
  const parts = token.split(".");
  parts[2] = `${parts[2][0] === "a" ? "b" : "a"}${parts[2].slice(1)}`;
  assert.throws(() => verifyToken(parts.join(".")));
});
test("XP thresholds map to the documented levels", () => {
  assert.equal(levelFromXp(0), "Beginner");
  assert.equal(levelFromXp(200), "Explorer");
  assert.equal(levelFromXp(500), "Developer");
  assert.equal(levelFromXp(1000), "Engineer");
  assert.equal(levelFromXp(2000), "Campus Legend");
});
