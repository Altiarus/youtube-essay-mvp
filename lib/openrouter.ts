const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const MAX_TRANSCRIPT_CHARS = 6_000;
const TRANSCRIPT_HEAD_CHARS = 4_500;
const TRANSCRIPT_TAIL_CHARS = 1_500;

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function prepareTranscriptForEssay(transcript: string) {
  if (transcript.length <= MAX_TRANSCRIPT_CHARS) {
    return transcript;
  }

  // Free OpenRouter models are unstable on very long prompts, so keep the
  // opening context and final section where videos often summarize the point.
  const head = transcript.slice(0, TRANSCRIPT_HEAD_CHARS);
  const tail = transcript.slice(-TRANSCRIPT_TAIL_CHARS);

  return `${head}\n\n[Часть середины транскрипта опущена из-за длины ролика.]\n\n${tail}`;
}

export async function createEssay(transcript: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "YouTube Essay MVP",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Ты пишешь на русском языке краткие связные эссе по транскриптам YouTube-видео. " +
            "Сделай 5-8 абзацев простым языком: главная мысль, ключевые аргументы, важные детали и общий вывод. " +
            "Не упоминай, что работаешь с транскриптом, и не добавляй фактов, которых нет в исходном тексте.",
        },
        {
          role: "user",
          content: `Сделай краткое эссе сути ролика по этому тексту:\n\n${prepareTranscriptForEssay(transcript)}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 900,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;

  if (response.status === 402) {
    throw new Error("OPENROUTER_INSUFFICIENT_CREDITS");
  }

  if (!response.ok) {
    throw new Error(payload.error?.message || "OpenRouter request failed");
  }

  const essay = payload.choices?.[0]?.message?.content?.trim();

  if (!essay) {
    throw new Error("OpenRouter returned an empty response");
  }

  return essay;
}
