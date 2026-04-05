type EmbedProvider = "youtube" | "instagram" | "twitter" | "unknown";

interface EmbedInfo {
  provider: EmbedProvider;
  embedUrl: string | null;
}

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/;

const INSTAGRAM_REGEX = /instagram\.com\/(?:p|reel|tv)\/([\w-]+)/;

const TWITTER_REGEX = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;

export function detectEmbed(url: string): EmbedInfo {
  const ytMatch = url.match(YOUTUBE_REGEX);
  if (ytMatch) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
    };
  }

  const igMatch = url.match(INSTAGRAM_REGEX);
  if (igMatch) {
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed`,
    };
  }

  const twMatch = url.match(TWITTER_REGEX);
  if (twMatch) {
    return {
      provider: "twitter",
      embedUrl: null, // Twitter uses blockquote + script embed
    };
  }

  return { provider: "unknown", embedUrl: null };
}

export function getTweetId(url: string): string | null {
  const match = url.match(TWITTER_REGEX);
  return match ? match[1] : null;
}

export function normalizeTwitterUrl(url: string): string {
  return url.replace("x.com", "twitter.com");
}
