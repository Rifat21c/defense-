"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser, routeForRole } from "@/lib/demoStore";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [department, setDepartment] = useState("Computer Science");
  const [error, setError] = useState("");

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const result = registerUser({ name, email, password, role, department });

    if (!result.user) {
      setError(result.error);
      return;
    }

    router.push(routeForRole(result.user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-on-surface">
      <form onSubmit={handleRegister} className="glass-card w-full max-w-xl rounded-lg p-8">
        <p className="font-label text-sm font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim">AssessNova AI</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Accounts are saved through the backend data layer, with Supabase persistence when project credentials are configured.
        </p>

        {error && <p className="mt-5 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error">{error}</p>}

        <label className="mt-6 block text-sm font-medium text-on-surface-variant">Full name</label>
        <input className="premium-input mt-2 w-full rounded-lg p-3" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="mt-4 block text-sm font-medium text-on-surface-variant">Email</label>
        <input className="premium-input mt-2 w-full rounded-lg p-3" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <label className="mt-4 block text-sm font-medium text-on-surface-variant">Password</label>
        <input className="premium-input mt-2 w-full rounded-lg p-3" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant">Role</label>
            <select className="premium-input mt-2 w-full rounded-lg p-3" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="student">Student</option>
              <option value="professor">Professor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant">Department</label>
            <input className="premium-input mt-2 w-full rounded-lg p-3" value={department} onChange={(e) => setDepartment(e.target.value)} required />
          </div>
        </div>

        <button className="mt-6 w-full rounded-lg bg-primary-container p-3 font-bold text-background shadow-glow transition hover:brightness-110">Create account</button>

        <p className="mt-5 text-sm text-on-surface-variant">
          Already registered? <Link className="font-semibold underline" href="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
