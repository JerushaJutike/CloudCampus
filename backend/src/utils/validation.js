function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
function positiveId(value) {
  if (
    !/^[1-9]\d*$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  )
    fail("A positive integer ID is required");
  return Number(value);
}
function text(value, name, max = 10000, min = 0) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.length > max
  )
    fail(`${name} must contain ${min} to ${max} characters`);
  return value.trim();
}
function httpUrl(value) {
  if (value == null || value === "") return null;
  text(value, "URL", 2048, 1);
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      fail("Use an HTTP or HTTPS URL without credentials");
    return url.toString();
  } catch {
    fail("Use a valid HTTP or HTTPS URL");
  }
}
module.exports = { fail, positiveId, text, httpUrl };
