import type { IntegrityEventType, RiskLevel } from "@/lib/types";

export const riskPoints: Record<IntegrityEventType, number> = {
  TAB_SWITCH: 2,
  COPY_PASTE: 3,
  FULLSCREEN_EXIT: 3,
  WINDOW_BLUR: 2,
  WINDOW_MINIMIZE: 2,
  BROWSER_FOCUS_LOSS: 2,
  BROWSER_TAB_CHANGE: 3,
  INACTIVITY: 1,
  BLOCKED_APP_OPEN: 4,
  EXAM_CLIENT_CLOSED: 4,
  MULTIPLE_MONITORS: 3,
};

export function riskLevel(points: number): RiskLevel {
  if (points >= 8) return "High";
  if (points >= 4) return "Medium";
  return "Low";
}

export function eventLabel(eventType: IntegrityEventType) {
  return eventType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
