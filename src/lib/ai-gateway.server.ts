import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) {
      runId = nextRunId;
    }
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }

      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  initialRunId?: string,
  options?: { structuredOutputs?: boolean },
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch as typeof fetch,
  });

  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

/** Default chat model used by every WorkFlow AI tool. */
export const WORKFLOW_AI_MODEL = "google/gemini-3.7-flash";

/**
 * Maps a Lovable AI Gateway failure into a human-readable, non-technical message.
 * See ai-gateway-error-semantics: only 429/5xx are transient.
 */
export function toFriendlyAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const status = /\b(400|401|402|403|429|5\d\d)\b/.exec(raw)?.[1];

  switch (status) {
    case "402":
      return "The AI workspace has run out of credits. Please add credits in Lovable to keep generating.";
    case "403":
      return "AI access is currently blocked by your workspace policy. Please contact your administrator.";
    case "429":
      return "Too many requests right now. Please wait a few seconds and try again.";
    case "401":
      return "The AI service is not configured correctly. Please contact your administrator.";
    case "400":
      return "The AI service could not process this input. Try shortening or simplifying it.";
    default:
      if (status) {
        return "The AI service is temporarily unavailable. Please try again in a moment.";
      }
      return "We couldn't generate your response right now. Please check your connection and try again.";
  }
}
