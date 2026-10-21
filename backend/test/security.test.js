const test = require("node:test"),
  assert = require("node:assert/strict");
const { positiveId, httpUrl } = require("../src/utils/validation");
const { scoreQuestions } = require("../src/services/quizService");
const { validateFile } = require("../src/services/fileService");
test("uploads enforce size, type and file signatures", () => {
  assert.throws(() =>
    validateFile(Buffer.from("<script>bad</script>"), "image/png"),
  );
  assert.throws(() => validateFile(Buffer.alloc(5242881), "application/pdf"));
  assert.throws(() => validateFile(Buffer.from("%PDF-"), "text/html"));
  assert.doesNotThrow(() =>
    validateFile(Buffer.from("%PDF-1.7 sample"), "application/pdf"),
  );
});
test("IDs and links reject invalid and executable inputs", () => {
  for (const value of [
    "0",
    "-1",
    "1.5",
    "1 OR 1=1",
    null,
    {},
    "9999999999999999999999",
  ])
    assert.throws(() => positiveId(value));
  assert.equal(positiveId("42"), 42);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "https://user:password@example.com",
  ])
    assert.throws(() => httpUrl(url));
  assert.equal(httpUrl("https://example.com"), "https://example.com/");
});
test("quiz scoring handles answer types, missing answers, exact sets and invalid points", () => {
  const questions = [
    { id: 1, correct_answer: "A", points: 1 },
    { id: 2, correct_answer: "true", points: 1 },
    { id: 3, correct_answer: '["A","B"]', points: 2 },
    { id: 4, correct_answer: '"42"', points: 1 },
  ];
  assert.deepEqual(
    scoreQuestions(questions, { 1: "a", 2: true, 3: ["B", "A"], 4: "42" }),
    { score: 5, max: 5, percentage: 100 },
  );
  assert.equal(scoreQuestions(questions, { 3: ["A"] }).score, 0);
  assert.equal(scoreQuestions(questions, {}).percentage, 0);
  assert.throws(() =>
    scoreQuestions([{ id: 1, points: 0, correct_answer: "A" }], {}),
  );
  assert.equal(
    scoreQuestions(
      [
        {
          id: 1,
          points: 1,
          correct_answer: "Hello",
          question_type: "code_output",
        },
      ],
      { 1: "hello" },
    ).score,
    0,
  );
});
test("bcrypt hashing verifies and legacy scrypt passwords remain usable", async () => {
  const {
    hashPassword,
    verifyPassword,
  } = require("../src/services/authService");
  const password = "secure-test-password";
  const hash = await hashPassword(password);
  assert.match(hash, /^\$2/);
  assert.ok(await verifyPassword(password, hash));
  assert.equal(await verifyPassword("incorrect", hash), false);
  const crypto = require("node:crypto"),
    salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  assert.ok(await verifyPassword(password, `scrypt$${salt}$${derived}`));
  assert.equal(await verifyPassword(password, "scrypt$bad$bad"), false);
});
