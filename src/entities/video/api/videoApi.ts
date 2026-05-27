import { fetcher } from "@/shared/api/fetcher";
import type { Video } from "../model/types";

export function getVideos(
  channelId: string,
  cursor?: string,
): Promise<{ videos: Video[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ channelId });
  if (cursor) params.set("cursor", cursor);
  return fetcher(`/api/videos?${params.toString()}`);
}

export function getVideoById(id: string): Promise<Video> {
  return fetcher<Video>(`/api/videos/${id}`);
}
