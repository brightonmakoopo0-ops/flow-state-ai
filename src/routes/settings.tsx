import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ResponsibleAiNotice } from "@/components/ResponsibleAiNotice";
import { Field, PrimaryButton, SelectInput, TextInput } from "@/components/ToolWorkspace";
import { EMAIL_TONES } from "@/lib/ai-schemas";
import { DEFAULT_PREFERENCES, readPreferences, writePreferences } from "@/lib/history";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Workspace Settings — WorkFlow AI" },
      {
        name: "description",
        content:
          "Set your display name, default email tone, working hours and whether generations are saved on this device.",
      },
      { property: "og:title", content: "Workspace Settings — WorkFlow AI" },
      {
        property: "og:description",
        content: "Personal productivity preferences for the WorkFlow AI workspace.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);

  useEffect(() => setPrefs(readPreferences()), []);

  return (
    <AppShell sectionNumber="06" sectionTitle="Settings">
      <div className="fade-in">
        <h2 className="text-2xl font-bold tracking-tighter">Workspace settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferences are stored locally on this device. WorkFlow AI collects no account data.
        </p>
      </div>

      <div className="max-w-xl space-y-5 rounded-xl border border-border bg-card p-6 fade-in">
        <Field label="Display name">
          <TextInput
            value={prefs.displayName}
            onChange={(e) => setPrefs({ ...prefs, displayName: e.target.value })}
          />
        </Field>
        <Field label="Default email tone">
          <SelectInput
            value={prefs.defaultTone}
            onChange={(e) => setPrefs({ ...prefs, defaultTone: e.target.value })}
          >
            {EMAIL_TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Default working hours">
          <TextInput
            value={prefs.workingHours}
            onChange={(e) => setPrefs({ ...prefs, workingHours: e.target.value })}
          />
        </Field>
        <label className="flex items-start gap-3 rounded-md border border-border bg-surface p-3">
          <input
            type="checkbox"
            checked={prefs.saveHistory}
            onChange={(e) => setPrefs({ ...prefs, saveHistory: e.target.checked })}
            className="mt-0.5 size-4 rounded border-border accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            <span className="block text-sm font-medium text-foreground">
              Save generations to history
            </span>
            Keeps a local log of AI outputs so you can revisit them. Turn this off if you work with
            sensitive material.
          </span>
        </label>
        <PrimaryButton
          onClick={() => {
            writePreferences({ ...prefs, displayName: prefs.displayName.trim() || "there" });
            toast.success("Preferences saved.");
          }}
        >
          Save preferences
        </PrimaryButton>
      </div>

      <ResponsibleAiNotice />
    </AppShell>
  );
}
