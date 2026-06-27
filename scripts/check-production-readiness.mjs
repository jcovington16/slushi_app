import { checkProductionReadiness, readinessSummary } from "../src/lib/production-readiness.ts";

const checks = checkProductionReadiness(process.env);
const summary = readinessSummary(checks);

console.log("Slushi Squad production readiness\n");
for (const check of checks) {
  const icon = check.ok ? "OK" : check.severity === "error" ? "ERROR" : "WARN";
  console.log(`${icon} ${check.name}: ${check.message}`);
}

console.log(`\nErrors: ${summary.errors.length}`);
console.log(`Warnings: ${summary.warnings.length}`);

if (!summary.ok) {
  process.exit(1);
}
