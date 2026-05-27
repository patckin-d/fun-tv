export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
} as const;
