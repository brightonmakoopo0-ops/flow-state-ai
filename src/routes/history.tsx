import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ResponsibleAiNotice } from "@/components/ResponsibleAiNotice";
import { CopyButton, EmptyState, GhostButton } from "@/components/ToolWorkspace";
import {
  clearHistory,
  readHistory,
  relativeTime,
  removeHistoryEntry,
  TOOL_LABELS,
  type HistoryEntry,
  type ToolId,
} from "@/lib/history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Generation History — WorkFlow AI" },
      {
        name: "description",
        content:
          "Review, copy or delete every AI generation you've made. History is stored on your device only.",
      },
      { property: "og:title", content: "Generation History — WorkFlow AI" },
      {
        property: "og:description",
        content: "A local, private log of your AI emails, summaries and schedules.",
      },
    ],
  }),
  component: HistoryPage,
});

const FILTERS: { id: ToolId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "email", label: "Emails" },
  { id: "meeting", label: "Summaries" },
  { id: "planner", label: "Schedules" },
];

function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<ToolId | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setEntries(readHistory());
    sync();
    window.addEventListener("workflow-ai:history", sync);
    return () => window.removeEventListener("workflow-ai:history", sync);
  }, []);

  const visible = entries.filter((e) => filter === "all" || e.tool === filter);

  return (
    <AppShell sectionNumber="05" sectionTitle="History">
      <div className="flex flex-wrap items-end justify-between gap-3 fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">Generation history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stored in your browser only — never uploaded, and cleared whenever you say so.
          </p>
        </div>
        <GhostButton
          onClick={() => {
            clearHistory();
            toast.success("History cleared from this device.");
          }}
          disabled={entries.length === 0}
        >
          <Trash2 className="size-3" aria-hidden /> Clear all
        </GhostButton>
      </div>

      <div className="flex flex-wrap gap-2 fade-in">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              filter === f.id
                ? "border-primary/30 bg-accent text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Generations from the three AI tools will appear here automatically."
        />
      ) : (
        <ul className="space-y-3 fade-in">
          {visible.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {TOOL_LABELS[entry.tool]} · {relativeTime(entry.createdAt)}
                  </p>
                  <p className="truncate text-sm font-semibold">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.preview}</p>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => setOpenId(openId === entry.id ? null : entry.id)}>
                    {openId === entry.id ? "Hide" : "View"}
                  </GhostButton>
                  <CopyButton value={JSON.stringify(entry.payload, null, 2)} />
                  <GhostButton
                    onClick={() => {
                      removeHistoryEntry(entry.id);
                      toast.success("Entry deleted.");
                    }}
                    title="Delete entry"
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </GhostButton>
                </div>
              </div>
              {openId === entry.id && (
                <pre className="mt-3 max-h-80 overflow-auto rounded-md border border-border bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}

      <ResponsibleAiNotice />
    </AppShell>
  );
}
