import { createFileRoute } from "@tanstack/react-router";
import { Eye, Lock, ScanSearch, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RESPONSIBLE_AI_TEXT, ResponsibleAiNotice } from "@/components/ResponsibleAiNotice";

export const Route = createFileRoute("/responsible-ai")({
  head: () => ({
    meta: [
      { title: "Responsible AI Practices — WorkFlow AI" },
      {
        name: "description",
        content:
          "How WorkFlow AI keeps humans in the loop: hallucination mitigation, transparency, privacy and graceful error handling.",
      },
      { property: "og:title", content: "Responsible AI Practices — WorkFlow AI" },
      {
        property: "og:description",
        content: "Human oversight, transparency, privacy and hallucination mitigation, explained.",
      },
    ],
  }),
  component: ResponsibleAiPage,
});

const PILLARS = [
  {
    icon: Eye,
    title: "Human oversight",
    body: "Every output is a draft. Emails and schedules are editable in place, action items are shown with their owners so you can verify them, and nothing is sent, saved externally or acted on automatically.",
  },
  {
    icon: ScanSearch,
    title: "Hallucination mitigation",
    body: "Prompts explicitly forbid inventing names, dates, decisions or commitments. Where information is missing, the AI must return null or list the gap — the meeting summarizer surfaces an 'unclear or missing' section and the planner lists every assumption it made.",
  },
  {
    icon: Lock,
    title: "Privacy by default",
    body: "There is no account, no tracking and no server-side database. Preferences and history live in your browser's local storage and can be cleared at any time. Your input is sent to the AI provider only when you press generate.",
  },
  {
    icon: ShieldCheck,
    title: "Transparency & graceful failure",
    body: "AI output is always labelled as AI-generated. API keys stay server-side, and failures — rate limits, outages, exhausted credits, malformed responses — are surfaced as plain-language messages rather than technical errors.",
  },
];

const LIMITS = [
  "The AI can misread ambiguous notes and mis-assign an owner or deadline.",
  "Schedules are estimates: it cannot see your calendar, energy levels or interruptions.",
  "Tone is approximated — read the draft aloud before sending anything sensitive.",
  "It has no knowledge of your internal systems, policies or confidential context.",
];

function ResponsibleAiPage() {
  return (
    <AppShell sectionNumber="07" sectionTitle="Responsible AI">
      <div className="fade-in">
        <h2 className="text-2xl font-bold tracking-tighter">Responsible AI at WorkFlow</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{RESPONSIBLE_AI_TEXT}</p>
      </div>

      <div className="grid gap-4 fade-in sm:gap-6 lg:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
              <p.icon className="size-5" aria-hidden />
            </div>
            <h3 className="mb-2 font-bold">{p.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-6 fade-in">
        <div className="label-mono mb-3">Known limitations</div>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <ResponsibleAiNotice />
    </AppShell>
  );
}
