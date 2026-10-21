function validateRegistration(body) {
  const { name, email, password } = body || {};
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 100
  )
    return "Name must be between 2 and 100 characters";
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email.trim())
  )
    return "A valid email address is required";
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  )
    return "Password must contain at least 8 characters and at most 72 UTF-8 bytes";
  return null;
}
module.exports = { validateRegistration };
