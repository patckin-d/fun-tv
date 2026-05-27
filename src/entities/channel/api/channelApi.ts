import { fetcher } from "@/shared/api/fetcher";
import type { Channel } from "../model/types";

export function getChannels(): Promise<Channel[]> {
  return fetcher<Channel[]>("/api/channels");
}
