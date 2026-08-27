import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const RESPONSIBLE_AI_TEXT =
  "AI-generated content may contain mistakes or omissions. Always review AI-generated emails, summaries, schedules, and recommendations before using them in professional situations. Do not enter confidential, sensitive, or personally identifiable information unless your organization's approved AI policies permit it.";

export function ResponsibleAiNotice({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "rounded-xl border border-border bg-surface p-6 text-center fade-in",
        className,
      )}
    >
      <p className="mx-auto max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-bold text-foreground">Responsible AI Notice:</span>{" "}
        {RESPONSIBLE_AI_TEXT}
      </p>
    </footer>
  );
}

export function AiGeneratedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck className="size-3" aria-hidden />
      AI-generated · review before use
    </span>
  );
}
