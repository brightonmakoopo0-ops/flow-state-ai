import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, usePreferences } from "@/components/AppShell";
import { AiGeneratedBadge, ResponsibleAiNotice } from "@/components/ResponsibleAiNotice";
import {
  CopyButton,
  EmptyState,
  ErrorMessage,
  Field,
  GhostButton,
  LoadingSkeleton,
  PriorityTag,
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
  Workspace,
} from "@/components/ToolWorkspace";
import { planTasks } from "@/lib/ai.functions";
import type { PlannerOutput } from "@/lib/ai-schemas";
import { addHistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler — WorkFlow AI" },
      {
        name: "description",
        content:
          "Turn a task list into a prioritised daily or weekly schedule that fits your real working hours.",
      },
      { property: "og:title", content: "AI Task Planner & Scheduler — WorkFlow AI" },
      {
        property: "og:description",
        content: "Prioritise by deadline, importance and effort — and see what doesn't fit.",
      },
    ],
  }),
  component: PlannerTool,
});

const SAMPLE = `Complete project proposal — due Friday, high importance, ~3h
Study networking — no deadline, medium, ~1h
Reply to client emails — today, high, ~45m
Prepare presentation — Thursday, critical, ~2h
Attend team meeting — today 14:00, fixed, 1h
Submit monthly report — end of month, medium, ~1h`;

function toPlainText(o: PlannerOutput) {
  return [
    o.overview,
    ...o.days.map(
      (d) =>
        `\n${d.label}\n----------------\n` +
        d.blocks.map((b) => `${b.start}–${b.end}  [${b.priority}] ${b.task}`).join("\n"),
    ),
    o.unscheduled.length ? `\nUnscheduled\n----------------` : "",
    ...o.unscheduled.map((u) => `• ${u.task} — ${u.reason}`),
  ].join("\n");
}

function PlannerTool() {
  const prefs = usePreferences();
  const run = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [workingHours, setWorkingHours] = useState(prefs.workingHours);
  const [horizon, setHorizon] = useState<"Daily" | "Weekly">("Daily");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlannerOutput | null>(null);

  useEffect(() => setWorkingHours(prefs.workingHours), [prefs.workingHours]);

  async function generate() {
    if (tasks.trim().length < 5) {
      setError("Add at least one task before generating a schedule.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const output = await run({ data: { tasks, workingHours, horizon, preferences } });
      setResult(output);
      addHistoryEntry({
        tool: "planner",
        title: `${horizon} schedule`,
        preview: output.overview.slice(0, 120),
        payload: output,
      });
      toast.success("Schedule ready — adjust anything that doesn't fit your day.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell sectionNumber="04" sectionTitle="Task Planner">
      <div className="fade-in">
        <h2 className="text-2xl font-bold tracking-tighter">AI Task Planner &amp; Scheduler</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          List your tasks with deadlines, importance and rough durations. The AI builds a realistic
          plan inside your working hours and tells you honestly what didn't fit.
        </p>
      </div>

      <Workspace
        title="Planner workspace"
        status={loading ? "working" : error ? "error" : "ready"}
        input={
          <>
            <Field
              label="Tasks (one per line)"
              hint="Include deadline, importance and estimated duration where you know them."
            >
              <TextArea
                rows={10}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder={SAMPLE}
              />
            </Field>
            <GhostButton onClick={() => setTasks(SAMPLE)} className="w-full">
              Load example task list
            </GhostButton>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Working hours">
                <TextInput
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="09:00 – 17:00"
                />
              </Field>
              <Field label="Horizon">
                <SelectInput
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value as "Daily" | "Weekly")}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </SelectInput>
              </Field>
            </div>
            <Field label="Personal preferences">
              <TextArea
                rows={3}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Deep work in the morning, no meetings after 16:00, 15-minute breaks"
              />
            </Field>
            {error ? <ErrorMessage message={error} /> : null}
            <div className="space-y-2">
              <PrimaryButton onClick={generate} loading={loading}>
                {loading ? "Planning…" : "Generate schedule"}
              </PrimaryButton>
              <div className="flex gap-2">
                <GhostButton onClick={generate} disabled={loading || !result} className="flex-1">
                  Regenerate
                </GhostButton>
                <GhostButton
                  onClick={() => {
                    setTasks("");
                    setPreferences("");
                    setResult(null);
                    setError("");
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Clear
                </GhostButton>
              </div>
            </div>
          </>
        }
        output={
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-mono">AI-generated schedule</span>
              <CopyButton value={result ? toPlainText(result) : ""} label="Copy plan" />
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : result ? (
              <div className="space-y-4 fade-in">
                <AiGeneratedBadge />
                <p className="text-sm leading-relaxed text-muted-foreground">{result.overview}</p>

                {result.days.map((day) => (
                  <div key={day.label} className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-widest">
                      {day.label}
                    </h4>
                    <ul className="space-y-3">
                      {day.blocks.map((b, i) => (
                        <li key={i} className="border-l-2 border-primary/40 pl-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                                {b.start} – {b.end}
                              </p>
                              <p className="text-sm font-medium">{b.task}</p>
                            </div>
                            <PriorityTag priority={b.priority} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{b.rationale}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {result.unscheduled.length > 0 && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest">
                      Didn't fit this {horizon === "Daily" ? "day" : "week"}
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {result.unscheduled.map((u, i) => (
                        <li key={i}>
                          <span className="font-medium text-foreground">{u.task}</span> — {u.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.assumptions.length > 0 && (
                  <div className="rounded-lg border border-border p-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Assumptions the AI made
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                      {result.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No schedule yet"
                description="Add your tasks and working hours, then generate a plan."
              />
            )}
          </>
        }
      />

      <ResponsibleAiNotice />
    </AppShell>
  );
}
