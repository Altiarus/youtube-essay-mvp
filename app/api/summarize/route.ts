import { NextResponse } from "next/server";
import { createEssay } from "@/lib/openrouter";
import { getTranscript } from "@/lib/supadata";
import { normalizeYouTubeUrl } from "@/lib/youtube";

type SummarizeRequest = {
  url?: unknown;
};

function publicError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function mapServiceError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  // Keep provider details server-side while still returning actionable messages.
  if (message.includes("SUPADATA_API_KEY")) {
    return publicError("Сервис не настроен: отсутствует Supadata API-ключ.", 500);
  }

  if (message.includes("OPENROUTER_API_KEY")) {
    return publicError("Сервис не настроен: отсутствует OpenRouter API-ключ.", 500);
  }

  if (message.includes("OPENROUTER_INSUFFICIENT_CREDITS")) {
    return publicError(
      "На аккаунте OpenRouter недостаточно кредитов для генерации эссе.",
      402,
    );
  }

  if (
    message.includes("Transcript is unavailable") ||
    message.includes("Transcript job failed") ||
    message.includes("Transcript job timed out")
  ) {
    return publicError(
      "Не удалось получить транскрипт ролика. Возможно, видео недоступно или у него нет субтитров.",
      502,
    );
  }

  return publicError("Не удалось обработать ролик, попробуйте позже.", 502);
}

export async function POST(request: Request) {
  let payload: SummarizeRequest;

  try {
    payload = (await request.json()) as SummarizeRequest;
  } catch {
    return publicError("Некорректный JSON в запросе.");
  }

  if (typeof payload.url !== "string" || !payload.url.trim()) {
    return publicError("Вставьте ссылку на YouTube-ролик.");
  }

  const normalizedUrl = normalizeYouTubeUrl(payload.url.trim());

  if (!normalizedUrl) {
    return publicError("Нужна корректная ссылка на YouTube-ролик.");
  }

  try {
    const transcript = await getTranscript(normalizedUrl);
    const essay = await createEssay(transcript);

    return NextResponse.json({
      essay,
      source: {
        url: normalizedUrl,
      },
    });
  } catch (error) {
    console.error("Summarize API error", error);
    return mapServiceError(error);
  }
}
