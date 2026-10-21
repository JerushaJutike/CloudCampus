const fs = require("node:fs/promises");
const path = require("node:path");
const { fail } = require("../utils/validation");
const root = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, "../../data/uploads"),
);
function validateFile(buffer, type) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > 5242880)
    fail("Upload must be between 1 byte and 5 MB");
  const valid = {
    "image/png": buffer
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/jpeg": buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255,
    "image/webp":
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP",
    "application/pdf": buffer.subarray(0, 5).toString() === "%PDF-",
  };
  if (!valid[type])
    fail(
      "Supported files: PNG, JPEG, WebP and PDF. Content must match its type.",
    );
}
function localPath(key) {
  if (!/^[0-9]+\/[a-f0-9-]{36}$/.test(key)) fail("File key is invalid");
  const target = path.resolve(root, ...key.split("/"));
  if (!target.startsWith(root + path.sep)) fail("File key is invalid");
  return target;
}
let s3;
function client() {
  if (!s3) {
    const { S3Client } = require("@aws-sdk/client-s3");
    s3 = new S3Client({ region: process.env.AWS_REGION });
  }
  return s3;
}
async function put(key, body, type) {
  if (process.env.S3_BUCKET) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: type,
        ServerSideEncryption: "AES256",
      }),
    );
  } else {
    if (process.env.NODE_ENV === "production")
      fail("S3 storage must be configured in production", 503);
    const target = localPath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body, { flag: "wx" });
  }
}
async function get(key) {
  if (process.env.S3_BUCKET) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    return (
      await client().send(
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      )
    ).Body;
  }
  return require("node:fs").createReadStream(localPath(key));
}
async function remove(key) {
  if (process.env.S3_BUCKET) {
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    await client().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  } else await fs.unlink(localPath(key));
}
module.exports = { validateFile, put, get, remove };
