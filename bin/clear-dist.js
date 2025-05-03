const path = require("node:path");
const fs = require("node:fs");

clearDist();

function clearDist() {
  const distDir = path.resolve("dist");
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
}
