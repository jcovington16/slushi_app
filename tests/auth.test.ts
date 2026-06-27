import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { hashAdminPassword, parseSignedSession, verifyPassword } from "../src/lib/auth";

describe("admin password verification", () => {
  it("verifies pbkdf2 admin password hashes", () => {
    const originalHash = process.env.ADMIN_PASSWORD_HASH;
    const originalPassword = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD_HASH = hashAdminPassword("super-secret", "fixedsalt");
    delete process.env.ADMIN_PASSWORD;

    expect(verifyPassword("super-secret")).toBe(true);
    expect(verifyPassword("wrong-secret")).toBe(false);

    if (originalHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = originalHash;
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("parses signed sessions when the admin email contains dots", () => {
    const value = "admin@slushisquad.local:1781225907247";
    const signature = createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "dev-only-slushi-secret")
      .update(value)
      .digest("hex");

    expect(parseSignedSession(`${value}.${signature}`)).toEqual({ value, signature });
  });
});
