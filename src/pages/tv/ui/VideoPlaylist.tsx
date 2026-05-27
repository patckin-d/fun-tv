"use client";

import type { Video } from "@/entities/video";
import { VideoCard } from "./VideoCard";

interface VideoPlaylistProps {
  videos: Video[];
  currentVideo: Video | null;
  onSelect: (video: Video) => void;
}

export function VideoPlaylist({ videos, currentVideo, onSelect }: VideoPlaylistProps) {
  if (videos.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--tv-muted)", fontSize: "12px", letterSpacing: "0.08em" }}
      >
        НА ЭТОМ КАНАЛЕ ПУСТО
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-full items-start px-4 py-3 overflow-x-auto scrollbar-none">
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
