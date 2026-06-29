import { rm } from "node:fs/promises";
import { spawn, execSync } from "node:child_process";
import process from "node:process";

function killPort(port) {
  try {
    const stdout = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (!stdout) return;

    for (const pid of stdout.split("\n").filter(Boolean)) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        // ponytail: process already exited, nothing to clean up
      }
    }
  } catch {
    // ponytail: lsof exits non-zero when nothing is listening
  }
}

const children = [];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 150);
}

async function main() {
  killPort(4000);
  killPort(4001);
  await rm(".next", { recursive: true, force: true });

  const web = spawn("npx", ["next", "dev", "-p", "4001"], {
    stdio: "inherit",
    env: process.env
  });
  const chat = spawn("node", ["--watch", "--watch-preserve-output", "--import", "tsx", "chat-server/src/index.ts"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "4000" }
  });

  children.push(web, chat);

  web.on("exit", (code) => shutdown(code ?? 0));
  chat.on("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
