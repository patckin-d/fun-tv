"use client";

import type { Video } from "@/entities/video";
import { VideoCard } from "./VideoCard";

interface VideoPlaylistProps {
  videos: Video[];
  currentVideo: Video | null;
  onSelect: (video: Video) => void;
}

export function VideoPlaylist({
  videos,
  currentVideo,
  onSelect,
}: VideoPlaylistProps) {
  if (videos.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          color: "var(--tv-muted)",
          fontSize: "12px",
          letterSpacing: "0.08em",
        }}
      >
        НА ЭТОМ КАНАЛЕ ПУСТО
      </div>
    );
  }

  return (
    <div className="flex h-full scrollbar-none items-start gap-3 overflow-x-auto px-4 py-3">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={currentVideo?.id === video.id}
          onClick={() => onSelect(video)}
        />
      ))}
    </div>
  );
}
