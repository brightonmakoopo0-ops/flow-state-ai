/**
 * Lightweight client-side persistence for activity history and preferences.
 * Nothing is sent anywhere except the AI request the user explicitly triggers.
 */

export type ToolId = "email" | "meeting" | "planner";

export type HistoryEntry = {
  id: string;
  tool: ToolId;
  title: string;
  preview: string;
  createdAt: string;
  payload: unknown;
};

export type Preferences = {
  displayName: string;
  defaultTone: string;
  workingHours: string;
  saveHistory: boolean;
};

const HISTORY_KEY = "workflow-ai.history.v1";
const PREFS_KEY = "workflow-ai.preferences.v1";

export const DEFAULT_PREFERENCES: Preferences = {
  displayName: "there",
  defaultTone: "Professional",
  workingHours: "09:00 – 17:00",
  saveHistory: true,
};

export const TOOL_LABELS: Record<ToolId, string> = {
  email: "Smart Email",
  meeting: "Meeting Summarizer",
  planner: "Task Planner",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry[] {
  if (!isBrowser()) return [];
  if (!readPreferences().saveHistory) return readHistory();
  const next: HistoryEntry[] = [
    { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ...readHistory(),
  ].slice(0, 50);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("workflow-ai:history"));
  return next;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  if (!isBrowser()) return [];
  const next = readHistory().filter((e) => e.id !== id);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("workflow-ai:history"));
  return next;
}

export function clearHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  window.localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event("workflow-ai:history"));
  return [];
}

export function readPreferences(): Preferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw
      ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<Preferences>) }
      : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(prefs: Preferences) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event("workflow-ai:preferences"));
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
