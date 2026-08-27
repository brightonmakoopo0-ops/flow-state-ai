import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, ClipboardList, Mail } from "lucide-react";
import { AppShell, usePreferences } from "@/components/AppShell";
import { ResponsibleAiNotice } from "@/components/ResponsibleAiNotice";
import { PriorityTag } from "@/components/ToolWorkspace";
import {
  readHistory,
  relativeTime,
  TOOL_LABELS,
  type HistoryEntry,
  type ToolId,
} from "@/lib/history";
import type { MeetingOutput, PlannerOutput } from "@/lib/ai-schemas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkFlow AI — Intelligent Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "One workspace for AI email drafting, meeting summarisation and task scheduling — with responsible-AI safeguards built in.",
      },
      { property: "og:title", content: "WorkFlow AI — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, summarise meetings and build optimised schedules from a single AI dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS: { id: ToolId; to: string; title: string; blurb: string; icon: typeof Mail }[] = [
  {
    id: "email",
    to: "/email",
    title: "Smart Email",
    blurb:
      "Craft professional correspondence across multiple tones with context-aware generation.",
    icon: Mail,
  },
  {
    id: "meeting",
    to: "/meetings",
    title: "Meeting Summarizer",
    blurb:
      "Transform notes into concise summaries, key decisions, and prioritized action items.",
    icon: ClipboardList,
  },
  {
    id: "planner",
    to: "/planner",
    title: "AI Task Planner",
    blurb: "Build optimized daily schedules based on deadlines, effort levels, and focus hours.",
    icon: CalendarClock,
  },
];

function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const sync = () => setHistory(readHistory());
    sync();
    window.addEventListener("workflow-ai:history", sync);
    return () => window.removeEventListener("workflow-ai:history", sync);
  }, []);
  return history;
}

function Dashboard() {
  const prefs = usePreferences();
  const history = useHistory();

  const stats = useMemo(() => {
    const lastWeek = history.filter(
      (h) => Date.now() - new Date(h.createdAt).getTime() < 7 * 864e5,
    );
    const minutesSaved = lastWeek.reduce(
      (acc, h) => acc + (h.tool === "meeting" ? 25 : h.tool === "planner" ? 20 : 8),
      0,
    );
    return {
      runs: history.length,
      timeSaved: (minutesSaved / 60).toFixed(1),
      thisWeek: lastWeek.length,
    };
  }, [history]);

  const todaysTasks = useMemo(() => {
    const plan = history.find((h) => h.tool === "planner");
    if (!plan) return [];
    const payload = plan.payload as PlannerOutput;
    return payload.days?.[0]?.blocks?.slice(0, 4) ?? [];
  }, [history]);

  const deadlines = useMemo(() => {
    const entries = history.filter((h) => h.tool === "meeting").slice(0, 3);
    return entries.flatMap((e) => (e.payload as MeetingOutput).importantDates ?? []).slice(0, 4);
  }, [history]);

  return (
    <AppShell sectionNumber="01" sectionTitle="Dashboard">
      <section className="fade-in">
        <h2 className="mb-1 text-2xl font-bold tracking-tighter sm:text-3xl">
          Welcome back, {prefs.displayName}.
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Three AI tools, one workspace. Everything you generate stays on this device until you use
          it.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          <StatCard label="AI runs" value={String(stats.runs).padStart(2, "0")} note="All time" />
          <StatCard
            label="Time saved (est.)"
            value={`${stats.timeSaved}h`}
            note="Past 7 days, estimated"
          />
          <StatCard
            label="Generations this week"
            value={String(stats.thisWeek).padStart(2, "0")}
            note="Across all three tools"
          />
        </div>
      </section>

      <section className="fade-in">
        <div className="label-mono mb-4">02 / AI Toolkit</div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                <tool.icon className="size-5" aria-hidden />
              </div>
              <h3 className="mb-2 font-bold">{tool.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{tool.blurb}</p>
              <Link
                to={tool.to}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline"
              >
                Open Tool <ArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 fade-in lg:grid-cols-2">
        <Panel title="Today's plan" empty={todaysTasks.length === 0} emptyHint="Generate a schedule in the Task Planner to see today's blocks here." link={{ to: "/planner", label: "Open planner" }}>
          <ul className="divide-y divide-border">
            {todaysTasks.map((block, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{block.task}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {block.start} – {block.end}
                  </p>
                </div>
                <PriorityTag priority={block.priority} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Upcoming deadlines" empty={deadlines.length === 0} emptyHint="Summarise meeting notes to extract deadlines and milestones." link={{ to: "/meetings", label: "Open summarizer" }}>
          <ul className="divide-y divide-border">
            {deadlines.map((d, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-3">
                <p className="min-w-0 truncate text-sm">{d.event}</p>
                <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                  {d.date}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="fade-in">
        <div className="label-mono mb-4">04 / Recent activity</div>
        <div className="rounded-xl border border-border bg-card">
          {history.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No AI activity yet. Pick a tool above to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {history.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{entry.preview}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">
                      {TOOL_LABELS[entry.tool]}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {relativeTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ResponsibleAiNotice />
    </AppShell>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="label-mono mb-4">{label}</div>
      <div className="text-3xl font-bold tracking-tighter sm:text-4xl">{value}</div>
      <div className="mt-2 text-xs font-medium text-muted-foreground">{note}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  empty,
  emptyHint,
  link,
}: {
  title: string;
  children: React.ReactNode;
  empty: boolean;
  emptyHint: string;
  link: { to: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <Link to={link.to} className="font-mono text-[10px] uppercase text-primary hover:underline">
          {link.label}
        </Link>
      </div>
      {empty ? <p className="py-4 text-xs text-muted-foreground">{emptyHint}</p> : children}
    </div>
  );
}
