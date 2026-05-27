import type { Video, Channel, Platform } from "@/generated/prisma/client";

export type { Video, Platform };

export type PlaylistState = {
  currentIndex: number;
  videos: Video[];
  channelId: string;
};

export type VideoWithChannel = Video & {
  channel: Channel;
};
