import { AlertTriangle, Check, Copy, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="label-mono block">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "resize-none", props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, props.className)} />;
}

export function PrimaryButton({
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <GhostButton
      title="Copy to clipboard"
      disabled={!value}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      {copied ? "Copied" : label}
    </GhostButton>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

export function Workspace({
  title,
  status,
  input,
  output,
}: {
  title: string;
  status: "ready" | "working" | "error";
  input: ReactNode;
  output: ReactNode;
}) {
  const statusMap = {
    ready: { label: "READY", dot: "bg-success" },
    working: { label: "GENERATING", dot: "bg-warning animate-pulse" },
    error: { label: "ERROR", dot: "bg-destructive" },
  } as const;
  const s = statusMap[status];

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card fade-in">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", s.dot)} />
          <span className="font-mono text-[10px] text-muted-foreground">{s.label}</span>
        </div>
      </div>
      <div className="grid lg:grid-cols-2">
        <div className="space-y-4 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
          {input}
        </div>
        <div className="space-y-4 bg-surface/40 p-4 sm:p-6">{output}</div>
      </div>
    </section>
  );
}

export function PriorityTag({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/15 text-warning-foreground border-warning/30",
    Medium: "bg-info/10 text-info border-info/20",
    Low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest",
        map[priority] ?? map["Low"],
      )}
    >
      {priority}
    </span>
  );
}
