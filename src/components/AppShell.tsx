import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardList,
  History,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_PREFERENCES, readPreferences, type Preferences } from "@/lib/history";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, group: "Navigation" },
  { to: "/email", label: "Email Generator", icon: Mail, group: "Navigation" },
  { to: "/meetings", label: "Meeting Summarizer", icon: ClipboardList, group: "Navigation" },
  { to: "/planner", label: "Task Planner", icon: CalendarClock, group: "Navigation" },
  { to: "/history", label: "History", icon: History, group: "System" },
  { to: "/settings", label: "Settings", icon: Settings, group: "System" },
  { to: "/responsible-ai", label: "Responsible AI", icon: ShieldCheck, group: "System" },
] as const;

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  useEffect(() => {
    const sync = () => setPrefs(readPreferences());
    sync();
    window.addEventListener("workflow-ai:preferences", sync);
    return () => window.removeEventListener("workflow-ai:preferences", sync);
  }, []);
  return prefs;
}

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const groups = ["Navigation", "System"] as const;
  return (
    <nav className="flex-1 space-y-6 px-4">
      {groups.map((group) => (
        <div key={group}>
          <div className="label-mono mb-2 px-2">{group}</div>
          <div className="space-y-1">
            {NAV.filter((item) => item.group === group).map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-primary hover:text-primary" }}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const prefs = usePreferences();
  return (
    <>
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
          W
        </div>
        <span className="text-lg font-bold tracking-tight">WorkFlow AI</span>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="border-t border-border p-4">
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="label-mono mb-1">Signed in as</div>
          <div className="text-xs font-medium">{prefs.displayName}</div>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  sectionNumber,
  sectionTitle,
  children,
  actions,
}: {
  sectionNumber: string;
  sectionTitle: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/10">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-sidebar shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="truncate font-mono text-xs tracking-tight text-muted-foreground sm:text-sm">
              {sectionNumber} / {sectionTitle.toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted-foreground md:inline">{now}</span>
            {actions}
          </div>
        </header>

        <div className={cn("mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-8")}>{children}</div>
      </main>
    </div>
  );
}
