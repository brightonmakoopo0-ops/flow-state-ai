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
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
  Workspace,
} from "@/components/ToolWorkspace";
import { generateEmail } from "@/lib/ai.functions";
import { EMAIL_TONES, type EmailOutput, type EmailTone } from "@/lib/ai-schemas";
import { addHistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkFlow AI" },
      {
        name: "description",
        content:
          "Generate professional workplace emails in five tones from your own key points, with editable AI output.",
      },
      { property: "og:title", content: "Smart Email Generator — WorkFlow AI" },
      {
        property: "og:description",
        content: "Turn a few bullet points into a reviewable, professional email draft.",
      },
    ],
  }),
  component: EmailTool,
});

const EMPTY = {
  recipient: "",
  purpose: "",
  keyPoints: "",
  outcome: "",
  extraInstructions: "",
};

function EmailTool() {
  const prefs = usePreferences();
  const run = useServerFn(generateEmail);
  const [form, setForm] = useState(EMPTY);
  const [tone, setTone] = useState<EmailTone>("Professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EmailOutput | null>(null);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    if (EMAIL_TONES.includes(prefs.defaultTone as EmailTone)) {
      setTone(prefs.defaultTone as EmailTone);
    }
  }, [prefs.defaultTone]);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  async function generate() {
    if (!form.recipient.trim() || !form.purpose.trim() || form.keyPoints.trim().length < 5) {
      setError("Please fill in the recipient, the purpose, and at least one key point.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const output = await run({ data: { ...form, tone } });
      setResult(output);
      setSubject(output.subject);
      setDraft(output.body);
      addHistoryEntry({
        tool: "email",
        title: output.subject,
        preview: `${tone} tone · to ${form.recipient}`,
        payload: output,
      });
      toast.success("Email draft ready — please review before sending.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setForm(EMPTY);
    setResult(null);
    setDraft("");
    setSubject("");
    setError("");
  }

  return (
    <AppShell sectionNumber="02" sectionTitle="Email Generator">
      <div className="fade-in">
        <h2 className="text-2xl font-bold tracking-tighter">Smart Email Generator</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Describe the situation in your own words. WorkFlow AI drafts the email from your key
          points only — it will flag anything it needs from you rather than inventing it.
        </p>
      </div>

      <Workspace
        title="Email workspace"
        status={loading ? "working" : error ? "error" : "ready"}
        input={
          <>
            <Field label="Recipient / context">
              <TextInput
                value={form.recipient}
                onChange={set("recipient")}
                placeholder="Priya, project manager at DesignCo"
              />
            </Field>
            <Field label="Subject or purpose">
              <TextInput
                value={form.purpose}
                onChange={set("purpose")}
                placeholder="Request feedback on Q3 deliverables"
              />
            </Field>
            <Field label="Key points" hint={`${form.keyPoints.length} characters`}>
              <TextArea
                rows={5}
                value={form.keyPoints}
                onChange={set("keyPoints")}
                placeholder={"- Deliverables submitted Monday\n- Need comments by Friday EOD\n- Final review is next Tuesday"}
              />
            </Field>
            <Field label="Desired outcome">
              <TextInput
                value={form.outcome}
                onChange={set("outcome")}
                placeholder="A written confirmation by Friday"
              />
            </Field>
            <Field label="Additional instructions">
              <TextInput
                value={form.extraInstructions}
                onChange={set("extraInstructions")}
                placeholder="Keep it under 150 words"
              />
            </Field>
            <Field label="Tone">
              <SelectInput value={tone} onChange={(e) => setTone(e.target.value as EmailTone)}>
                {EMAIL_TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {error ? <ErrorMessage message={error} /> : null}
            <div className="space-y-2">
              <PrimaryButton onClick={generate} loading={loading}>
                {loading ? "Generating…" : "Generate email"}
              </PrimaryButton>
              <div className="flex gap-2">
                <GhostButton onClick={generate} disabled={loading || !result} className="flex-1">
                  Regenerate
                </GhostButton>
                <GhostButton onClick={clearAll} disabled={loading} className="flex-1">
                  Clear
                </GhostButton>
              </div>
            </div>
          </>
        }
        output={
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-mono">AI-generated output</span>
              <CopyButton value={`Subject: ${subject}\n\n${draft}`} label="Copy email" />
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : result ? (
              <div className="space-y-4 fade-in">
                <AiGeneratedBadge />
                <Field label="Subject">
                  <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
                </Field>
                <Field label="Body (editable)" hint={`${words} words · ${draft.length} characters`}>
                  <TextArea rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} />
                </Field>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Tone applied:</span>{" "}
                  {result.toneNotes}
                </p>
                {result.missingInformation.length > 0 && (
                  <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest">
                      Check before sending
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                      {result.missingInformation.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No draft yet"
                description="Fill in the left panel and select a tone, then generate your email."
              />
            )}
          </>
        }
      />

      <ResponsibleAiNotice />
    </AppShell>
  );
}
