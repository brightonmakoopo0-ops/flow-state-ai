# WorkFlow AI — Intelligent Workplace Productivity Assistant

## Project Overview

**WorkFlow AI** is a single, unified workspace that helps employees automate three of the most
repetitive parts of knowledge work:

1. writing routine professional emails,
2. turning messy meeting notes into decisions and action items,
3. converting a scattered task list into a realistic schedule.

**The problem.** Surveys of knowledge work consistently show that a large share of the working day
disappears into communication and coordination overhead rather than the work itself: re-drafting
the same kinds of emails, rewriting notes after every meeting, and re-planning a to-do list that
never fits the available hours. None of this is intellectually hard — it is just slow, repetitive,
and easy to do badly when you are tired.

**Why AI helps.** These three tasks are all *text transformation with judgement*: take unstructured
human input, apply a consistent professional standard, and return a structured draft. That is
exactly what a large language model is good at — provided it is tightly constrained so it never
invents facts. WorkFlow AI does the first 80% of the drafting; the human always does the last 20%
of review.

**Target users.** Individual contributors, team leads, project managers, consultants and students
in professional programmes — anyone who writes work emails, attends meetings and plans their week.

---

## Features

### Smart Email Generator (`/email`)

- Inputs: recipient/context, subject or purpose, key points, desired outcome, extra instructions.
- Five tones: Formal, Friendly, Persuasive, Professional, Concise.
- Generate / Regenerate / Copy / Clear actions.
- Output is fully editable in place, with live word and character counts.
- The AI returns a `missingInformation` list — anything you should fill in before sending — instead
  of quietly inventing details.

### Meeting Notes Summarizer (`/meetings`)

- Paste notes or upload a `.txt` / `.md` transcript.
- Structured extraction: **Summary**, **Key Decisions**, **Action Items** (task, owner, priority,
  deadline) and **Important Dates**.
- Owner and deadline are `null` when the notes don't identify them — never guessed.
- An "unclear or missing information" panel makes gaps explicit.

### AI Task Planner & Scheduler (`/planner`)

- Enter tasks with deadlines, importance and estimated durations, plus your working hours,
  horizon (daily/weekly) and personal preferences.
- Prioritisation across Critical / High / Medium / Low, based on deadline urgency, importance,
  effort, dependencies and remaining working time.
- Visual timeline per day, an explicit **"didn't fit"** list, and every assumption disclosed.

### Dashboard (`/`)

Welcome message, productivity statistics, the three tool cards, today's plan, upcoming deadlines
and a recent-activity feed — all derived from your own generations.

### History, Settings and Responsible AI

- `/history` — filterable log of every generation, with view, copy and delete, plus "clear all".
- `/settings` — display name, default tone, default working hours, and a switch to stop saving
  history entirely.
- `/responsible-ai` — the safeguards, the known limitations and the disclaimer, in full.

### Responsive UI

Desktop (fixed sidebar, two-column workspaces), tablet (adaptive grids) and mobile (single column,
hamburger navigation, touch-sized controls, no horizontal scrolling).

---

## Tools & Technologies

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Framework | React 19 + TanStack Start (full-stack, SSR) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 with an oklch semantic design-token system |
| UI | Custom components + shadcn/ui primitives, lucide-react icons, sonner toasts |
| Backend | TanStack Start server functions (`createServerFn`) |
| AI | Lovable AI Gateway via the Vercel AI SDK (`google/gemini-3.7-flash`) |
| Validation | Zod (input validation + structured output schemas) |
| Storage | Browser local storage (history + preferences) |
| Tooling | Vite 8, ESLint, Prettier, Bun |

---

## Installation

```bash
git clone <repository-url>
cd workflow-ai
bun install     # or: npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Where it is read | Purpose |
| --- | --- | --- |
| `LOVABLE_API_KEY` | server only, inside handlers | Authenticates calls to the AI gateway |

The key is read with `process.env` **inside** server-function handlers. It is never prefixed with
`VITE_`, never sent to the browser, and never present in the client bundle. On Lovable it is
provisioned automatically.

## Running the Application

```bash
bun run dev       # development server (frontend + server functions) on :8080
bun run build     # production build
bun run preview   # preview the production build
bun run lint      # lint
```

TanStack Start runs the frontend and the backend from a single process, so there is no separate
backend command.

---

## Usage

**Generate an email.** Sidebar → *Email Generator*. Enter who it's for, the purpose and your key
points, pick a tone, press **Generate email**. Edit the subject/body directly, then **Copy email**.

**Summarize meeting notes.** Sidebar → *Meeting Summarizer*. Paste notes (or upload a `.txt`),
press **Generate summary**, and review the Summary / Decisions / Action Items / Important Dates
cards plus the "unclear or missing" panel. **Copy all** exports plain text.

**Create a task schedule.** Sidebar → *Task Planner*. List tasks (`Task — deadline, importance,
duration`), set working hours and Daily/Weekly, add preferences, press **Generate schedule**.
Review the timeline, the unscheduled list and the assumptions.

---

## Prompt Engineering

Prompts are constructed programmatically in `src/lib/prompts.ts`, and user input never mixes with
system instructions: the instruction block is passed as the `system` message, user data is passed
as the `prompt` message, and each user field is wrapped in an explicit fence
(`<<<KEY_POINTS … KEY_POINTS>>>`) so injected text cannot masquerade as an instruction.

Every prompt follows the same skeleton:

```
ROLE:        who the model is acting as
CONTEXT:     the workplace situation
TASK:        the single job to perform
CONSTRAINTS: tone, scope, and the shared anti-fabrication rules
OUTPUT FORMAT: field-by-field description of the required structure
```

The shape of the answer is additionally enforced with a Zod schema through the AI SDK's structured
output API, so the UI always receives typed objects (`EmailOutput`, `MeetingOutput`,
`PlannerOutput`) rather than free text that has to be parsed.

This improves:

- **Accuracy** — explicit "do not infer owners/deadlines/decisions" constraints.
- **Consistency** — the same role and constraints on every call.
- **Tone** — the selected tone is injected into the constraint block, not merely suggested.
- **Formatting** — schema-validated fields instead of markdown guesswork.
- **Reliability** — schema violations are caught and reported as a friendly retry message.

---

## Responsible AI

- **Human oversight** — all output is presented as an editable draft; nothing is sent or actioned
  automatically, and each output panel carries an "AI-generated · review before use" badge.
- **Transparency** — a Responsible AI notice appears on every page, and `/responsible-ai`
  documents the safeguards and limitations.
- **Data privacy** — no accounts, no analytics, no server-side database. History and preferences
  live in browser local storage, can be deleted per-entry or entirely, and saving can be switched
  off completely in Settings.
- **Hallucination mitigation** — anti-fabrication constraints in every prompt; `null` owners and
  deadlines instead of guesses; an "unclear or missing information" section on summaries; a
  disclosed assumptions list on schedules; an unscheduled list rather than an over-packed day.
- **Graceful failure** — gateway errors (rate limit, exhausted credits, blocked policy, outage,
  malformed response) are mapped to plain-language messages in `src/lib/ai-gateway.server.ts`.
- **Secret hygiene** — the AI key is server-side only.

---

## Project Structure

```
src/
├── components/
│   ├── AppShell.tsx            # sidebar + responsive header layout
│   ├── ResponsibleAiNotice.tsx # disclaimer + AI-generated badge
│   ├── ToolWorkspace.tsx       # reusable input/output workspace primitives
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── ai-gateway.server.ts    # AI provider wiring + friendly error mapping
│   ├── ai-run.server.ts        # server-only generation logic
│   ├── ai.functions.ts         # API layer: validated server functions
│   ├── ai-schemas.ts           # Zod input/output contracts (shared types)
│   ├── prompts.ts              # structured prompt construction
│   └── history.ts              # local persistence (history + preferences)
├── routes/                     # file-based routes / pages
│   ├── index.tsx               # dashboard
│   ├── email.tsx  meetings.tsx  planner.tsx
│   ├── history.tsx  settings.tsx  responsible-ai.tsx
│   └── __root.tsx              # document shell, fonts, toaster
└── styles.css                  # design tokens (oklch) + utilities
```

The layering is `UI components → application logic (hooks/state) → API layer (server functions) →
AI service → storage`, with prompts and provider wiring isolated behind the server boundary.

---

## Testing

Manual test matrix used for this build:

**Functional** — emails generate for all five tones and tone changes visibly change the register;
meeting notes yield summary, decisions, action items and dates; deadlines are extracted verbatim;
tasks are prioritised and scheduled inside the stated working hours; over-committed lists produce
an unscheduled list rather than an impossible day.

**UI/UX** — desktop (1440px), tablet (768px) and mobile (390px) layouts; sidebar and hamburger
navigation; empty, loading, success, error and disabled states; keyboard focus rings on all
controls; no horizontal scrolling at any breakpoint.

**AI** — repeated runs on the same input for consistency; notes with no decisions ("no decisions
were recorded"); notes with unnamed owners (`null`, not a guess); nonsense input handled without
fabrication; oversized input surfaces a friendly error.

---

## Team Members

- Your Name — Full-Stack Developer / AI Engineer

---

## Future Improvements

- Cloud sync with authenticated accounts and shared team history.
- Calendar integration (Google/Outlook) so the planner can see real availability.
- Direct send/draft-to-inbox from the email generator.
- Audio upload with speech-to-text for meeting recordings.
- Exports to PDF/DOCX/ICS.
- Per-organisation prompt and tone presets, and an admin policy layer.

---

## License

MIT.
