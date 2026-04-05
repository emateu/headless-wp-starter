export function getSiteUrl(): string {
  return process.env.SITE_URL ?? "http://localhost:3000";
}
