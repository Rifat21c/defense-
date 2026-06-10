import { isRealSupabaseConfig } from "@/lib/supabaseClient";

export type SystemCapability = {
  name: string;
  status: "Ready" | "Configured" | "Needs setup";
  detail: string;
};

export function getSystemCapabilities(): SystemCapability[] {
  const hasAiProvider = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  const hasSupabaseConfig = isRealSupabaseConfig();

  return [
    {
      name: "Assessment Website",
      status: "Ready",
      detail: "Role dashboards, course management, quiz workflow, results, analytics, and integrity review are available.",
    },
    {
      name: "Desktop Integrity Monitor",
      status: "Ready",
      detail: "Electron client connects to the website API and reports blocked apps, focus loss, inactivity, close attempts, and multiple displays.",
    },
    {
      name: "Database Layer",
      status: hasSupabaseConfig ? "Configured" : "Ready",
      detail: hasSupabaseConfig
        ? "Supabase-backed app-state persistence is configured for users, courses, quizzes, submissions, analytics, and integrity logs."
        : "Server backend persistence is active with .data/app-store.json. Add Supabase keys to store the same data in Supabase.",
    },
    {
      name: "AI Feedback",
      status: hasAiProvider ? "Configured" : "Ready",
      detail: hasAiProvider
        ? "An AI provider key is configured for server-side feedback generation."
        : "Professional heuristic feedback is active. Add GEMINI_API_KEY or OPENAI_API_KEY for provider-backed feedback.",
    },
  ];
}

export function getSystemHealthSummary() {
  const capabilities = getSystemCapabilities();
  const needsSetup = capabilities.filter((item) => item.status === "Needs setup").length;
  const database = capabilities.find((item) => item.name === "Database Layer");

  return {
    status:
      needsSetup > 0
        ? "Development ready"
        : database?.status === "Configured"
          ? "Production configured"
          : "Backend ready",
    generated_at: new Date().toISOString(),
    capabilities,
  };
}
