"use client";

import ReactPlayer from "react-player";
import type { Video } from "@/entities/video";

interface VideoPlayerProps {
  video: Video | null;
  onEnded: () => void;
  animKey: number;
  volume: number;
  muted: boolean;
  startOffset?: number;
}

export function VideoPlayer({ video, onEnded, animKey, volume, muted, startOffset }: VideoPlayerProps) {
  if (!video) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--tv-surface)" }}
      >
        <span className="text-6xl opacity-20">📺</span>
        <p
          style={{
            color: "var(--tv-muted)",
            fontSize: "13px",
            letterSpacing: "0.1em",
          }}
        >
          ВЫБЕРИ КАНАЛ
        </p>
      </div>
    );
  }

  const src = `https://www.youtube.com/watch?v=${video.videoId}?t=${startOffset ?? 0}s`;

  return (
    <div key={animKey} className="relative w-full h-full channel-in crt-scanlines">
      <ReactPlayer
        src={src}
        playing
        controls={false}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        onEnded={onEnded}
        autoPlay={true}
        light={false}
        config={{
          youtube: {
            referrerpolicy: "strict-origin-when-cross-origin",
            start: startOffset ?? 0,
            controls: 0,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            cc_load_policy: 0,
          } as Record<string, unknown>,
        }}
      />
      {/* Блокирует все клики и взаимодействие пользователя с плеером */}
      <div className="absolute inset-0 z-10" style={{ cursor: "default" }} />
    </div>
  );
}
