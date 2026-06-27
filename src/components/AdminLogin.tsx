"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

export function AdminLogin() {
  const [email, setEmail] = useState("admin@slushisquad.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      window.location.reload();
    } else {
      setError(data.error ?? "Could not log in.");
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 pb-12">
      <form onSubmit={login} className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-grape text-white">
          <LockKeyhole size={26} />
        </div>
        <h1 className="text-3xl font-black">Admin dashboard</h1>
        <p className="mt-2 font-bold text-ink/70">Manage orders, flavors, streets, and payments from your phone.</p>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-black text-grape">Email</span>
          <input
            className="focus-ring w-full rounded-2xl border-2 border-purple-100 px-4 py-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-2 block text-sm font-black text-grape">Password</span>
          <input
            className="focus-ring w-full rounded-2xl border-2 border-purple-100 px-4 py-3"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="mt-3 rounded-2xl bg-pink-50 p-3 text-sm font-bold text-pink-700">{error}</p>}
        <button className="focus-ring mt-5 w-full rounded-full bg-berry px-5 py-3 font-black text-white shadow-soft">
          Login
        </button>
      </form>
    </section>
  );
}
