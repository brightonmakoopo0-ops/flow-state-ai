import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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
  TextArea,
  TextInput,
  Workspace,
} from "@/components/ToolWorkspace";
import { summarizeMeeting } from "@/lib/ai.functions";
import type { MeetingOutput } from "@/lib/ai-schemas";
import { addHistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — WorkFlow AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into a summary, decisions, owned action items and key dates — without invented details.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — WorkFlow AI" },
      {
        property: "og:description",
        content: "Extract decisions, action items and deadlines from messy meeting notes.",
      },
    ],
  }),
  component: MeetingTool,
});

function toPlainText(o: MeetingOutput) {
  return [
    "Meeting Summary\n----------------",
    o.summary,
    "\nKey Decisions\n----------------",
    o.decisions.map((d) => `• ${d}`).join("\n") || "• None recorded",
    "\nAction Items\n----------------",
    o.actionItems
      .map(
        (a) =>
          `• ${a.task} — ${a.owner ?? "Owner not identified"} — ${a.deadline ?? "No deadline stated"} (${a.priority})`,
      )
      .join("\n") || "• None recorded",
    "\nImportant Dates\n----------------",
    o.importantDates.map((d) => `• ${d.date} — ${d.event}`).join("\n") || "• None recorded",
  ].join("\n");
}

function MeetingTool() {
  const run = useServerFn(summarizeMeeting);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MeetingOutput | null>(null);

  async function generate() {
    if (notes.trim().length < 20) {
      setError("Paste at least a few lines of meeting notes so the AI has something to work with.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const output = await run({ data: { notes, meetingTitle: title } });
      setResult(output);
      addHistoryEntry({
        tool: "meeting",
        title: title.trim() || "Meeting summary",
        preview: output.summary.slice(0, 120),
        payload: output,
      });
      toast.success("Summary ready — verify the extracted items.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 500_000) {
      setError("That file is too large. Please upload a text file under 500 KB.");
      return;
    }
    setNotes(await file.text());
    setError("");
  }

  return (
    <AppShell sectionNumber="03" sectionTitle="Meeting Summarizer">
      <div className="fade-in">
        <h2 className="text-2xl font-bold tracking-tighter">Meeting Notes Summarizer</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Paste or upload raw notes. The AI extracts only what your notes support and tells you what
          was unclear instead of filling the gaps.
        </p>
      </div>

      <Workspace
        title="Summarizer workspace"
        status={loading ? "working" : error ? "error" : "ready"}
        input={
          <>
            <Field label="Meeting title (optional)">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly product sync"
              />
            </Field>
            <Field
              label="Meeting notes / transcript"
              hint={`${notes.trim() ? notes.trim().split(/\s+/).length : 0} words`}
            >
              <TextArea
                rows={14}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste meeting notes here…"
              />
            </Field>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files?.[0])}
            />
            <GhostButton onClick={() => fileRef.current?.click()} className="w-full">
              <Upload className="size-3" aria-hidden /> Upload .txt or .md
            </GhostButton>
            {error ? <ErrorMessage message={error} /> : null}
            <div className="space-y-2">
              <PrimaryButton onClick={generate} loading={loading}>
                {loading ? "Analysing…" : "Generate summary"}
              </PrimaryButton>
              <div className="flex gap-2">
                <GhostButton onClick={generate} disabled={loading || !result} className="flex-1">
                  Regenerate
                </GhostButton>
                <GhostButton
                  onClick={() => {
                    setNotes("");
                    setTitle("");
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
              <span className="label-mono">AI intelligence output</span>
              <CopyButton value={result ? toPlainText(result) : ""} label="Copy all" />
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : result ? (
              <div className="space-y-4 fade-in">
                <AiGeneratedBadge />
                <Card title="Meeting Summary">
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
                </Card>
                <Card title="Key Decisions">
                  <BulletList
                    items={result.decisions}
                    empty="No explicit decisions were recorded in these notes."
                  />
                </Card>
                <Card title="Action Items">
                  {result.actionItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No action items were identifiable in these notes.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {result.actionItems.map((a, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{a.task}</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              {a.owner ?? "Owner not identified"} ·{" "}
                              {a.deadline ?? "No deadline stated"}
                            </p>
                          </div>
                          <PriorityTag priority={a.priority} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card title="Important Dates">
                  {result.importantDates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No dates were mentioned.</p>
                  ) : (
                    <ul className="space-y-2">
                      {result.importantDates.map((d, i) => (
                        <li key={i} className="flex justify-between gap-3 text-sm">
                          <span className="font-mono text-xs uppercase text-primary">{d.date}</span>
                          <span className="min-w-0 flex-1 text-muted-foreground">{d.event}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                {result.unclearOrMissing.length > 0 && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest">
                      Unclear or missing information
                    </p>
                    <BulletList items={result.unclearOrMissing} empty="" />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No summary yet"
                description="Paste your notes on the left and generate a structured summary."
              />
            )}
          </>
        }
      />

      <ResponsibleAiNotice />
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest">{title}</h4>
      {children}
    </div>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return empty ? <p className="text-xs text-muted-foreground">{empty}</p> : null;
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
