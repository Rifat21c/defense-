"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { addActivity, getData, requireRole, saveData } from "@/lib/demoStore";
import type { AppData, Role, User } from "@/lib/types";

export default function UserManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const auth = requireRole(["admin"]);
    if (auth.redirect) {
      router.replace(auth.redirect);
      return;
    }
    setUser(auth.user);
    setData(getData());
  }, [router]);

  function updateUser(userId: string, field: "role" | "department", value: string) {
    if (!data || !user) return;
    const next = {
      ...data,
      users: data.users.map((item) =>
        item.id === userId ? { ...item, [field]: field === "role" ? (value as Role) : value } : item,
      ),
    };
    saveData(next);
    addActivity(user.id, `Updated ${field} for ${data.users.find((item) => item.id === userId)?.name}`);
    setData(getData());
  }

  if (!user || !data) return null;

  return (
    <AppShell user={user} title="User Management" subtitle="Assign roles, manage departments, and audit platform access.">
      <Panel title="Users" eyebrow="access control">
        <div className="overflow-x-auto">
          <table className="premium-table min-w-[860px] text-left text-sm">
            <thead>
              <tr>
                <th className="py-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <select className="premium-input rounded-lg p-2 capitalize" value={item.role} onChange={(e) => updateUser(item.id, "role", e.target.value)}>
                      <option value="student">student</option>
                      <option value="professor">professor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <input className="premium-input rounded-lg p-2" value={item.department} onChange={(e) => updateUser(item.id, "department", e.target.value)} />
                  </td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
