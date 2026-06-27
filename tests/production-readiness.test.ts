import { describe, expect, it } from "vitest";
import { checkProductionReadiness, readinessSummary } from "../src/lib/production-readiness";

describe("production readiness checks", () => {
  it("passes required PostgreSQL production settings", () => {
    const checks = checkProductionReadiness({
      DATABASE_URL: "postgresql://user:pass@host/db",
      NEXT_PUBLIC_APP_URL: "https://slushisquad.example.com",
      ADMIN_EMAIL: "owner@example.com",
      ADMIN_SESSION_SECRET: "a".repeat(40),
      ADMIN_PASSWORD_HASH: "pbkdf2_sha256$310000$salt$hash",
      ENABLE_ADULT_BOOSTERS: "false",
      STRIPE_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123"
    });

    expect(readinessSummary(checks).ok).toBe(true);
  });

  it("blocks production readiness when adult boosters are enabled", () => {
    const checks = checkProductionReadiness({
      DATABASE_URL: "postgresql://user:pass@host/db",
      NEXT_PUBLIC_APP_URL: "https://slushisquad.example.com",
      ADMIN_EMAIL: "owner@example.com",
      ADMIN_SESSION_SECRET: "a".repeat(40),
      ADMIN_PASSWORD_HASH: "pbkdf2_sha256$310000$salt$hash",
      ENABLE_ADULT_BOOSTERS: "true"
    });

    const summary = readinessSummary(checks);
    expect(summary.ok).toBe(false);
    expect(summary.errors.some((check) => check.name === "ADULT_BOOSTERS_DISABLED")).toBe(true);
  });
});
