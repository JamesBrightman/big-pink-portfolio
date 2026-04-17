import { spawn } from "node:child_process";

const child = spawn("npm run build", {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    STATIC_EXPORT: "true",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
