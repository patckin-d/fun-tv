"use client";

import type { Video } from "@/entities/video";
import { formatDuration } from "@/shared/utils";
import { cn } from "@/shared/utils";

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  onClick: () => void;
}

export function VideoCard({ video, isActive, onClick }: VideoCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-44 shrink-0 flex-col gap-2 overflow-hidden rounded-xl text-left transition-all duration-200",
        isActive
          ? "scale-[1.02]"
          : "opacity-70 hover:scale-[1.01] hover:opacity-100",
      )}
      style={
        isActive
          ? {
              boxShadow:
                "0 0 0 2px var(--tv-accent), 0 0 20px rgba(244,168,41,0.3)",
            }
          : {}
      }
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
            }}
          >
            <span className="text-3xl opacity-40">📺</span>
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(244,168,41,0.15)" }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "var(--tv-accent)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-0.5 h-5 w-5 text-black"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration badge */}
        {video.durationSec != null && (
          <span
            className="absolute right-1.5 bottom-1.5 rounded px-1 py-0.5 font-mono text-white"
            style={{
              fontSize: "10px",
              background: "rgba(0,0,0,0.75)",
              letterSpacing: "0.02em",
            }}
          >
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>

      {/* Title */}
      <p
        className="line-clamp-2 px-1 pb-1 leading-snug"
        style={{
          fontSize: "11px",
          color: isActive ? "var(--tv-accent)" : "var(--tv-text)",
        }}
      >
        {video.title}
      </p>
    </button>
  );
}
