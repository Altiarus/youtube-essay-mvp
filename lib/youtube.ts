const ALLOWED_YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function normalizeYouTubeUrl(input: string): string | null {
  try {
    const parsedUrl = new URL(input);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!ALLOWED_YOUTUBE_HOSTS.has(hostname)) {
      return null;
    }

    if (hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? parsedUrl.toString() : null;
    }

    if (parsedUrl.pathname === "/watch" && parsedUrl.searchParams.get("v")) {
      return parsedUrl.toString();
    }

    if (parsedUrl.pathname.startsWith("/shorts/")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[1];
      return videoId ? parsedUrl.toString() : null;
    }

    return null;
  } catch {
    return null;
  }
}
