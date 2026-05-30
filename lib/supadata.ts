const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";
const POLL_DELAY_MS = 2_000;
const MAX_POLL_ATTEMPTS = 8;

type SupadataTranscriptChunk = {
  text?: string;
  content?: string;
};

type SupadataTranscriptResponse = {
  transcript?: string | SupadataTranscriptChunk[];
  text?: string;
  content?: string | SupadataTranscriptChunk[];
  jobId?: string;
  id?: string;
  status?: string;
  error?:
    | string
    | {
        message?: string;
      };
  message?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTranscript(payload: SupadataTranscriptResponse): string | null {
  if (typeof payload.transcript === "string") {
    return payload.transcript.trim() || null;
  }

  if (Array.isArray(payload.transcript)) {
    const text = payload.transcript
      .map((chunk) => chunk.text ?? chunk.content ?? "")
      .join(" ")
      .trim();

    return text || null;
  }

  if (typeof payload.text === "string") {
    return payload.text.trim() || null;
  }

  if (typeof payload.content === "string") {
    return payload.content.trim() || null;
  }

  if (Array.isArray(payload.content)) {
    const text = payload.content
      .map((chunk) => chunk.text ?? chunk.content ?? "")
      .join(" ")
      .trim();

    return text || null;
  }

  return null;
}

function extractErrorMessage(payload: SupadataTranscriptResponse) {
  if (typeof payload.error === "string") {
    return payload.error;
  }

  return payload.error?.message ?? payload.message;
}

async function requestSupadata(path: string, apiKey: string) {
  const response = await fetch(`${SUPADATA_BASE_URL}${path}`, {
    headers: {
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as SupadataTranscriptResponse;

  if (!response.ok) {
    const detail = extractErrorMessage(payload);
    throw new Error(detail || "Supadata request failed");
  }

  return payload;
}

async function pollTranscriptJob(jobId: string, apiKey: string) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_DELAY_MS);

    // Supadata may return a job id when transcript generation is asynchronous.
    // Polling here keeps the browser API simple: one request in, one answer out.
    const payload = await requestSupadata(
      `/transcript/${encodeURIComponent(jobId)}`,
      apiKey,
    );
    const transcript = extractTranscript(payload);

    if (transcript) {
      return transcript;
    }

    const status = payload.status?.toLowerCase();
    if (status === "failed" || status === "error") {
      throw new Error(extractErrorMessage(payload) || "Transcript job failed");
    }
  }

  throw new Error("Transcript job timed out");
}

export async function getTranscript(videoUrl: string) {
  const apiKey = process.env.SUPADATA_API_KEY;

  if (!apiKey) {
    throw new Error("SUPADATA_API_KEY is not configured");
  }

  const query = new URLSearchParams({
    url: videoUrl,
    mode: "auto",
    text: "true",
  });

  const payload = await requestSupadata(`/transcript?${query.toString()}`, apiKey);
  const transcript = extractTranscript(payload);

  if (transcript) {
    return transcript;
  }

  const jobId = payload.jobId ?? payload.id;
  if (jobId) {
    return pollTranscriptJob(jobId, apiKey);
  }

  throw new Error(extractErrorMessage(payload) || "Transcript is unavailable");
}
