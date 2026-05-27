import type { Channel } from "@/generated/prisma/client";

export type { Channel };

export type ChannelWithVideoCount = Channel & {
  _count: { videos: number };
};
