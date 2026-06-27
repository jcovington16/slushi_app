export type ReadinessCheck = {
  name: string;
  ok: boolean;
  severity: "error" | "warning";
  message: string;
};

export function checkProductionReadiness(env: NodeJS.ProcessEnv) {
  const checks: ReadinessCheck[] = [];
  const requireValue = (key: string, message: string) => {
    const ok = Boolean(env[key]);
    checks.push({ name: key, ok, severity: "error", message });
  };

  requireValue("DATABASE_URL", "Production PostgreSQL connection string is required.");
  requireValue("NEXT_PUBLIC_APP_URL", "Production app URL is required for Stripe redirects.");
  requireValue("ADMIN_EMAIL", "A real admin email is required.");
  requireValue("ADMIN_SESSION_SECRET", "Use a long random secret for signed admin sessions.");
  requireValue("ADMIN_PASSWORD_HASH", "Use ADMIN_PASSWORD_HASH in production instead of a plain admin password.");

  const databaseUrl = env.DATABASE_URL ?? "";
  checks.push({
    name: "DATABASE_URL_PROTOCOL",
    ok: databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://"),
    severity: "error",
    message: "DATABASE_URL must be a PostgreSQL connection string."
  });

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";
  checks.push({
    name: "NEXT_PUBLIC_APP_URL_HTTPS",
    ok: appUrl.startsWith("https://"),
    severity: "warning",
    message: "Production app URL should use HTTPS."
  });

  checks.push({
    name: "ADMIN_SESSION_SECRET_LENGTH",
    ok: (env.ADMIN_SESSION_SECRET ?? "").length >= 32,
    severity: "error",
    message: "ADMIN_SESSION_SECRET should be at least 32 characters."
  });

  checks.push({
    name: "NO_PLAIN_ADMIN_PASSWORD",
    ok: !env.ADMIN_PASSWORD || Boolean(env.ADMIN_PASSWORD_HASH),
    severity: "warning",
    message: "Prefer ADMIN_PASSWORD_HASH and remove plain ADMIN_PASSWORD in production."
  });

  checks.push({
    name: "ADULT_BOOSTERS_DISABLED",
    ok: env.ENABLE_ADULT_BOOSTERS !== "true",
    severity: "error",
    message: "Keep adult boosters disabled for the neighborhood kid-run launch."
  });

  for (const key of ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"]) {
    checks.push({
      name: key,
      ok: Boolean(env[key]),
      severity: "warning",
      message: `${key} is needed before live card/Apple Pay payments.`
    });
  }

  return checks;
}

export function readinessSummary(checks: ReadinessCheck[]) {
  const errors = checks.filter((check) => !check.ok && check.severity === "error");
  const warnings = checks.filter((check) => !check.ok && check.severity === "warning");
  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
