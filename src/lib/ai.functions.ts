import { createServerFn } from "@tanstack/react-start";
import {
  emailInputSchema,
  meetingInputSchema,
  plannerInputSchema,
  type EmailOutput,
  type MeetingOutput,
  type PlannerOutput,
} from "./ai-schemas";
import { runEmailGeneration, runMeetingSummary, runTaskPlanning } from "./ai-run.server";

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => emailInputSchema.parse(input))
  .handler(async ({ data }): Promise<EmailOutput> => runEmailGeneration(data));

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => meetingInputSchema.parse(input))
  .handler(async ({ data }): Promise<MeetingOutput> => runMeetingSummary(data));

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => plannerInputSchema.parse(input))
  .handler(async ({ data }): Promise<PlannerOutput> => runTaskPlanning(data));
