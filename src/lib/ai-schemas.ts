import { z } from "zod";

export const EMAIL_TONES = [
  "Formal",
  "Friendly",
  "Persuasive",
  "Professional",
  "Concise",
] as const;

export type EmailTone = (typeof EMAIL_TONES)[number];

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/* ---------------------------------- Email --------------------------------- */

export const emailInputSchema = z.object({
  recipient: z.string().trim().min(2, "Tell us who this email is for."),
  purpose: z.string().trim().min(2, "Add a subject or purpose."),
  keyPoints: z.string().trim().min(5, "Add at least one key point."),
  outcome: z.string().trim().default(""),
  extraInstructions: z.string().trim().default(""),
  tone: z.enum(EMAIL_TONES),
});
export type EmailInput = z.infer<typeof emailInputSchema>;

export const emailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
  toneNotes: z.string(),
  missingInformation: z.array(z.string()),
});
export type EmailOutput = z.infer<typeof emailOutputSchema>;

/* --------------------------------- Meeting -------------------------------- */

export const meetingInputSchema = z.object({
  notes: z.string().trim().min(20, "Paste at least a few lines of meeting notes."),
  meetingTitle: z.string().trim().default(""),
});
export type MeetingInput = z.infer<typeof meetingInputSchema>;

export const meetingOutputSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string().nullable(),
      priority: z.enum(PRIORITIES),
      deadline: z.string().nullable(),
    }),
  ),
  importantDates: z.array(z.object({ date: z.string(), event: z.string() })),
  unclearOrMissing: z.array(z.string()),
});
export type MeetingOutput = z.infer<typeof meetingOutputSchema>;

/* --------------------------------- Planner -------------------------------- */

export const plannerInputSchema = z.object({
  tasks: z.string().trim().min(5, "List at least one task."),
  workingHours: z.string().trim().default("09:00 – 17:00"),
  horizon: z.enum(["Daily", "Weekly"]),
  preferences: z.string().trim().default(""),
});
export type PlannerInput = z.infer<typeof plannerInputSchema>;

export const plannerOutputSchema = z.object({
  overview: z.string(),
  days: z.array(
    z.object({
      label: z.string(),
      blocks: z.array(
        z.object({
          start: z.string(),
          end: z.string(),
          task: z.string(),
          priority: z.enum(PRIORITIES),
          rationale: z.string(),
        }),
      ),
    }),
  ),
  unscheduled: z.array(z.object({ task: z.string(), reason: z.string() })),
  assumptions: z.array(z.string()),
});
export type PlannerOutput = z.infer<typeof plannerOutputSchema>;
