"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/demoStore";

export default function Navbar() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-4">
      <Link href="/" className="text-xl font-bold">AssessNova AI</Link>
      <div className="flex gap-4">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
      </div>
    </nav>
  );
}
