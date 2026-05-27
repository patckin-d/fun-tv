"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Video } from "@/entities/video";
import type { ScheduleEntry } from "@/entities/schedule";
import { VideoPlayer } from "./VideoPlayer";

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function entryToVideo(e: ScheduleEntry): Video {
  return {
    id: e.id,
    title: e.video.title,
    videoId: e.video.videoId,
    thumbnailUrl: e.video.thumbnailUrl,
    durationSec: e.video.durationSec,
    channelId: e.channelId,
    platform: "YOUTUBE",
    sortOrder: 0,
    isActive: true,
    viewCount: 0,
    createdAt: e.startsAt,
    updatedAt: e.startsAt,
  } as unknown as Video;
}

export function TvPage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [playerKey, setPlayerKey] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    fetch(`/api/schedule?date=${localDateStr(new Date())}`)
      .then((r) => r.json())
      .then((data: ScheduleEntry[]) => {
        setEntries(data);
        const now = new Date();
        const liveIdx = data.findIndex(
          (e) => new Date(e.startsAt) <= now && now < new Date(e.endsAt),
        );
        setCurrentIdx(liveIdx >= 0 ? liveIdx : 0);
        setIsLoading(false);
        setPlayerKey((k) => k + 1);
      });
  }, []);

  const currentVideo = entries[currentIdx] ? entryToVideo(entries[currentIdx]) : null;

  const handleVideoEnded = () => {
    const next = currentIdx + 1;
    if (next < entries.length) {
      setCurrentIdx(next);
      setPlayerKey((k) => k + 1);
    }
  };

  const channelTitle = entries[0]?.channel.title ?? "";

  return (
    <main
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "var(--tv-bg)", color: "var(--tv-text)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 shrink-0"
        style={{
          height: "48px",
          borderBottom: "1px solid var(--tv-border)",
          background: "rgba(8,8,8,0.95)",
        }}
      >
        <span
          className="tracking-widest select-none"
          style={{
            fontFamily: "'Dela Gothic One', sans-serif",
            fontSize: "18px",
            color: "var(--tv-accent)",
            textShadow: "0 0 12px rgba(244,168,41,0.5)",
          }}
        >
          fun.tv
        </span>

        {channelTitle && (
          <span
            className="uppercase tracking-[0.2em]"
            style={{ fontSize: "11px", color: "var(--tv-muted)" }}
          >
            {channelTitle}
          </span>
        )}

        <div className="flex items-center gap-4">
          <Link
            href="/program"
            className="tracking-wider uppercase"
            style={{ fontSize: "11px", color: "var(--tv-muted)", textDecoration: "none" }}
          >
            Программа
          </Link>

          <Link
            href="/admin/videos"
            className="tracking-wider uppercase"
            style={{ fontSize: "11px", color: "var(--tv-muted)", textDecoration: "none" }}
          >
            Админка
          </Link>

          {/* Volume controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMuted((m) => !m)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: muted ? "var(--tv-border)" : "var(--tv-muted)",
                fontSize: "14px",
                padding: "4px",
                lineHeight: 1,
              }}
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => { setMuted(false); setVolume((v) => Math.max(0, +(v - 0.1).toFixed(1))); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--tv-muted)",
                fontSize: "13px",
                padding: "4px 6px",
                lineHeight: 1,
              }}
            >
              −
            </button>
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "11px",
                color: "var(--tv-muted)",
                minWidth: "30px",
                textAlign: "center",
              }}
            >
              {muted ? "0%" : `${Math.round(volume * 100)}%`}
            </span>
            <button
              onClick={() => { setMuted(false); setVolume((v) => Math.min(1, +(v + 0.1).toFixed(1))); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--tv-muted)",
                fontSize: "13px",
                padding: "4px 6px",
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>

          <div
            className="flex items-center gap-1.5"
            style={{ fontSize: "11px", color: "var(--tv-muted)" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
            />
            <span className="tracking-wider uppercase">LIVE</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden" style={{ background: "#000" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--tv-accent)", borderTopColor: "transparent" }}
            />
          </div>
        ) : (
          <VideoPlayer
            video={currentVideo}
            onEnded={handleVideoEnded}
            animKey={playerKey}
            volume={volume}
            muted={muted}
          />
        )}
      </div>
    </main>
  );
}
