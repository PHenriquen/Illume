const fs = require("node:fs");

for (const directory of ["dist", "release"]) {
  fs.rmSync(directory, { recursive: true, force: true });
}
