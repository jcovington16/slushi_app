import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const maxAttempts = 30;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await execFileAsync("docker", ["compose", "exec", "-T", "db", "pg_isready", "-U", "slushi", "-d", "slushi_squad"]);
    console.log("Database is ready.");
    process.exit(0);
  } catch {
    console.log(`Waiting for database... (${attempt}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

console.error("Database did not become ready in time.");
process.exit(1);
