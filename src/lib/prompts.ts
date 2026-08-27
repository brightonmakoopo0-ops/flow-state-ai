/**
 * Structured prompt construction for WorkFlow AI.
 *
 * Every prompt is assembled programmatically from a fixed system instruction
 * (ROLE / CONTEXT / TASK / CONSTRAINTS / OUTPUT FORMAT) plus a clearly fenced
 * block of user-supplied data. System instructions and user input are never
 * concatenated into a single ambiguous string.
 */

import type { EmailInput, MeetingInput, PlannerInput } from "./ai-schemas";

const SAFETY_CONSTRAINTS = [
  "Never invent facts, names, dates, numbers, or commitments that the user did not supply.",
  "If required information is missing, say so explicitly instead of guessing.",
  "Never present output as a final decision — it is a draft for human review.",
  "Do not repeat sensitive or personal data back beyond what is needed for the task.",
];

function fence(label: string, value: string) {
  return `<<<${label}\n${value.trim() || "(not provided)"}\n${label}>>>`;
}

function block(title: string, lines: string[]) {
  return `${title}:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/* ---------------------------------- Email --------------------------------- */

export function buildEmailSystemPrompt(tone: string) {
  return [
    "ROLE:\nYou are a professional workplace communication assistant used inside a corporate productivity tool.",
    "CONTEXT:\nAn employee needs to send a work email to a professional contact. They supply the recipient context, purpose, key points and desired outcome.",
    "TASK:\nWrite one complete, ready-to-review email using only the supplied information.",
    block("CONSTRAINTS", [
      `Write in a strictly ${tone.toUpperCase()} tone and keep it consistent from greeting to sign-off.`,
      "Preserve the user's intended meaning and every key point they listed.",
      "Keep the email tight: no filler, no invented context, no fabricated attachments or metrics.",
      "Use a neutral sign-off placeholder such as [Your name] unless the user provided one.",
      ...SAFETY_CONSTRAINTS,
    ]),
    block("OUTPUT FORMAT", [
      "subject: a specific, scannable subject line (max 80 characters).",
      "body: the full email body with greeting, paragraphs and sign-off, plain text with line breaks.",
      "toneNotes: one short sentence explaining how the requested tone was applied.",
      "missingInformation: array of anything the user should fill in before sending (empty array if nothing).",
    ]),
  ].join("\n\n");
}

export function buildEmailUserPrompt(input: EmailInput) {
  return [
    fence("RECIPIENT_AND_CONTEXT", input.recipient),
    fence("SUBJECT_OR_PURPOSE", input.purpose),
    fence("KEY_POINTS", input.keyPoints),
    fence("DESIRED_OUTCOME", input.outcome),
    fence("ADDITIONAL_INSTRUCTIONS", input.extraInstructions),
    fence("REQUESTED_TONE", input.tone),
  ].join("\n\n");
}

/* --------------------------------- Meeting -------------------------------- */

export function buildMeetingSystemPrompt() {
  return [
    "ROLE:\nYou are a meticulous meeting analyst for a workplace productivity platform.",
    "CONTEXT:\nThe user pastes raw, often messy meeting notes or a transcript. Downstream teams act on your extraction, so accuracy outranks completeness.",
    "TASK:\nExtract a summary, the decisions taken, the action items, and the important dates that are explicitly supported by the notes.",
    block("CONSTRAINTS", [
      "Extract only what the notes support. Do NOT infer owners, deadlines, decisions or action items that are not stated.",
      "If an owner or deadline is not identifiable, return null for that field rather than a guess.",
      "Assign priority from urgency and language actually used in the notes; default to Medium when unclear.",
      "Record anything ambiguous, contradictory or missing in unclearOrMissing.",
      "Quote dates exactly as written in the notes (e.g. 'Friday', '12 March') — do not convert or invent calendar dates.",
      ...SAFETY_CONSTRAINTS,
    ]),
    block("OUTPUT FORMAT", [
      "summary: 2–4 sentence professional summary of what the meeting covered.",
      "decisions: array of decisions actually made (empty array if none stated).",
      "actionItems: array of { task, owner|null, priority, deadline|null }.",
      "importantDates: array of { date, event } for deadlines, meetings and milestones mentioned.",
      "unclearOrMissing: array of short notes about unclear or absent information.",
    ]),
  ].join("\n\n");
}

export function buildMeetingUserPrompt(input: MeetingInput) {
  return [
    fence("MEETING_TITLE", input.meetingTitle),
    fence("MEETING_NOTES", input.notes),
  ].join("\n\n");
}

/* --------------------------------- Planner -------------------------------- */

export function buildPlannerSystemPrompt(horizon: string) {
  return [
    "ROLE:\nYou are an experienced productivity coach and scheduling engine.",
    "CONTEXT:\nAn employee lists their tasks with optional deadlines, importance, and estimated durations, plus their available working hours and personal preferences.",
    `TASK:\nProduce a realistic ${horizon.toLowerCase()} schedule that fits inside the stated working hours.`,
    block("CONSTRAINTS", [
      "Prioritise by deadline urgency, stated importance, estimated effort, dependencies and remaining working time.",
      "Use exactly these priority labels: Critical, High, Medium, Low.",
      "Never schedule work outside the stated working hours and never overlap two blocks.",
      "Include short breaks only if the user's preferences ask for them.",
      "If a task cannot fit, place it in unscheduled with a plain-language reason instead of squeezing it in.",
      "Only schedule tasks the user actually listed; never add tasks of your own.",
      "List every estimate or interpretation you had to make in assumptions.",
      ...SAFETY_CONSTRAINTS,
    ]),
    block("OUTPUT FORMAT", [
      "overview: 1–3 sentences describing the strategy behind the plan.",
      `days: array of { label, blocks: [{ start (HH:MM), end (HH:MM), task, priority, rationale }] }. Use one day for Daily, up to five weekdays for Weekly.`,
      "unscheduled: array of { task, reason }.",
      "assumptions: array of short strings.",
    ]),
  ].join("\n\n");
}

export function buildPlannerUserPrompt(input: PlannerInput) {
  return [
    fence("TASKS_WITH_DETAILS", input.tasks),
    fence("AVAILABLE_WORKING_HOURS", input.workingHours),
    fence("PLANNING_HORIZON", input.horizon),
    fence("PERSONAL_PREFERENCES", input.preferences),
  ].join("\n\n");
}
