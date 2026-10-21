const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const roots = [
  path.join(__dirname, "../src"),
  path.join(__dirname, "../scripts"),
  path.join(__dirname, "../test"),
  path.join(__dirname, "../../frontend"),
];
let count = 0;
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (entry.name.endsWith(".js")) {
      const result = spawnSync(process.execPath, ["--check", file], {
        stdio: "inherit",
      });
      if (result.status) process.exit(result.status);
      count++;
    }
  }
}
for (const root of roots) inspect(root);
console.log(`Syntax validation passed for ${count} JavaScript files.`);
