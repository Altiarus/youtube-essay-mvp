"use client";

import { FormEvent, useState } from "react";

type SummarizeResponse =
  | {
      essay: string;
      source: {
        url: string;
      };
    }
  | {
      error: string;
    };

export default function Home() {
  const [url, setUrl] = useState("");
  const [essay, setEssay] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEssay("");
    setSourceUrl("");

    if (!url.trim()) {
      setError("Вставьте ссылку на YouTube-ролик.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const payload = (await response.json()) as SummarizeResponse;

      if (!response.ok || "error" in payload) {
        setError("error" in payload ? payload.error : "Не удалось обработать ролик.");
        return;
      }

      setEssay(payload.essay);
      setSourceUrl(payload.source.url);
    } catch {
      setError("Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="workspace">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Supadata + OpenRouter</p>
          <h1 id="page-title">Краткое эссе по сути YouTube-ролика</h1>
          <p className="lead">
            Вставьте ссылку на видео, а сервис получит транскрипт и сформулирует
            связное русское эссе с главной мыслью, аргументами и выводом.
          </p>
        </section>

        <section className="tool-panel" aria-label="Форма создания эссе">
          <form className="form" onSubmit={handleSubmit}>
            <input
              className="url-input"
              inputMode="url"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              type="url"
              value={url}
              aria-label="Ссылка на YouTube-ролик"
              disabled={isLoading}
            />
            <button className="submit-button" type="submit" disabled={isLoading}>
              {isLoading ? "Готовлю эссе..." : "Получить краткое эссе сути ролика"}
            </button>
          </form>

          {isLoading ? (
            <div className="status loading" role="status">
              Получаю транскрипт и передаю его модели. Для длинных роликов это может занять
              немного времени.
            </div>
          ) : null}

          {error ? (
            <div className="status error" role="alert">
              {error}
            </div>
          ) : null}

          {essay ? (
            <article className="result">
              <h2>Готовое эссе</h2>
              <div className="essay">{essay}</div>
              <div className="source">Источник: {sourceUrl}</div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
