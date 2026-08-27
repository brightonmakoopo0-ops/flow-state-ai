import { NoObjectGeneratedError, Output, streamText } from "ai";
import {
  emailOutputSchema,
  meetingOutputSchema,
  plannerOutputSchema,
  type EmailInput,
  type EmailOutput,
  type MeetingInput,
  type MeetingOutput,
  type PlannerInput,
  type PlannerOutput,
} from "./ai-schemas";
import {
  buildEmailSystemPrompt,
  buildEmailUserPrompt,
  buildMeetingSystemPrompt,
  buildMeetingUserPrompt,
  buildPlannerSystemPrompt,
  buildPlannerUserPrompt,
} from "./prompts";
import {
  createLovableAiGatewayProvider,
  toFriendlyAiError,
  WORKFLOW_AI_MODEL,
} from "./ai-gateway.server";
import type { z } from "zod";

function getModel() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    throw new Error("AI is not configured for this workspace. Please contact your administrator.");
  }
  return createLovableAiGatewayProvider(key)(WORKFLOW_AI_MODEL);
}

async function generateStructured<T extends z.ZodTypeAny>(
  schema: T,
  system: string,
  prompt: string,
): Promise<z.infer<T>> {
  try {
    const result = streamText({
      model: getModel(),
      system,
      prompt,
      output: Output.object({ schema }),
    });
    return (await result.output) as z.infer<T>;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error(
        "The AI returned an unexpected response. Please try again, or shorten your input.",
      );
    }
    throw new Error(toFriendlyAiError(error));
  }
}

export async function runEmailGeneration(data: EmailInput): Promise<EmailOutput> {
  return generateStructured(
    emailOutputSchema,
    buildEmailSystemPrompt(data.tone),
    buildEmailUserPrompt(data),
  );
}

export async function runMeetingSummary(data: MeetingInput): Promise<MeetingOutput> {
  return generateStructured(
    meetingOutputSchema,
    buildMeetingSystemPrompt(),
    buildMeetingUserPrompt(data),
  );
}

export async function runTaskPlanning(data: PlannerInput): Promise<PlannerOutput> {
  return generateStructured(
    plannerOutputSchema,
    buildPlannerSystemPrompt(data.horizon),
    buildPlannerUserPrompt(data),
  );
}
