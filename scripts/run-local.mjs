import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mode = process.argv[2] === "start" ? "start" : "dev";
const helperPort = process.env.LOCAL_UPLOAD_HELPER_PORT ?? "3210";
const nextBin = require.resolve("next/dist/bin/next");

const children = [
  spawn(process.execPath, [nextBin, mode], {
    stdio: "inherit",
    env: process.env,
  }),
  spawn(process.execPath, ["scripts/local-upload-helper.mjs"], {
    stdio: "inherit",
    env: {
      ...process.env,
      LOCAL_UPLOAD_HELPER_PORT: helperPort,
    },
  }),
];

let shuttingDown = false;

function stopChildren() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

children[0].on("exit", (code) => {
  stopChildren();
  process.exit(code ?? 0);
});

children[1].on("exit", (code) => {
  if (shuttingDown || code === 0 || code === null) {
    return;
  }

  stopChildren();
  process.exit(code);
});
