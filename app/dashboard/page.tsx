"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, routeForRole } from "@/lib/demoStore";

export default function DashboardRouterPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    router.replace(user ? routeForRole(user.role) : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-on-surface">
      <p className="glass-card rounded-lg px-5 py-4 text-sm text-on-surface-variant">Opening your dashboard...</p>
    </main>
  );
}
