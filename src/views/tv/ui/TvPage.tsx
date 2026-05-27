"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/entities/video";
import type { ScheduleEntry } from "@/entities/schedule";
import { VideoPlayer } from "./VideoPlayer";

const NEXT_BADGE_THRESHOLDS = [1200, 300, 60]; // seconds before end: 20min, 5min, 1min
const NEXT_BADGE_SHOW_MS = 15_000;
const THRESHOLD_LABELS: Record<number, string> = {
  1200: "через 20 минут",
  300: "через 5 минут",
  60: "через минуту",
};

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
  const [muted, setMuted] = useState(true);
  const [startOffset, setStartOffset] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Badge is visible when key matches; threshold drives the label
  const [badgeState, setBadgeState] = useState<{ key: number; threshold: number } | null>(null);
  const showNextBadge = badgeState?.key === playerKey;

  const videoWallStartRef = useRef(0);
  const shownThresholdsRef = useRef<Set<number>>(new Set());
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    fetch(`/api/schedule?date=${localDateStr(new Date())}`)
      .then((r) => r.json())
      .then((data: ScheduleEntry[]) => {
        setEntries(data);
        const now = new Date();
        const liveIdx = data.findIndex(
          (e) => new Date(e.startsAt) <= now && now < new Date(e.endsAt),
        );
        if (liveIdx >= 0) {
          const elapsed = Math.max(
            0,
            Math.floor((now.getTime() - new Date(data[liveIdx].startsAt).getTime()) / 1000),
          );
          setStartOffset(elapsed);
        }
        setCurrentIdx(liveIdx >= 0 ? liveIdx : 0);
        setPlayerKey((k) => k + 1);
        setIsLoading(false)
      });
  }, []);

  const currentVideo = entries[currentIdx] ? entryToVideo(entries[currentIdx]) : null;
  const nextEntry = entries[currentIdx + 1] ?? null;

  // Poll every second; show badge when remaining time crosses a threshold
  useEffect(() => {
    const dur = currentVideo?.durationSec ?? 0;
    const initialRemaining = dur - startOffset;

    // Initialize wall-clock reference and pre-mark already-elapsed thresholds
    videoWallStartRef.current = Date.now() - startOffset * 1000;
    shownThresholdsRef.current = new Set(NEXT_BADGE_THRESHOLDS.filter(t => initialRemaining <= t));
    if (badgeTimerRef.current) {
      clearTimeout(badgeTimerRef.current);
      badgeTimerRef.current = null;
    }

    if (!nextEntry || !dur) return;

    const key = playerKey;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - videoWallStartRef.current) / 1000;
      const remaining = dur - elapsed;

      for (const t of NEXT_BADGE_THRESHOLDS) {
        if (remaining <= t && !shownThresholdsRef.current.has(t)) {
          shownThresholdsRef.current.add(t);
          setBadgeState({ key, threshold: t });
          if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
          badgeTimerRef.current = setTimeout(() => setBadgeState(null), NEXT_BADGE_SHOW_MS);
          break;
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
        badgeTimerRef.current = null;
      }
    };
  }, [playerKey, currentVideo?.durationSec, nextEntry, startOffset]);

  const handleVideoEnded = () => {
    const next = currentIdx + 1;
    if (next < entries.length) {
      setCurrentIdx(next);
      setStartOffset(0);
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

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--tv-muted)",
              padding: "4px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M5 0v2H2v3H0V0h5zM9 0h5v5h-2V2H9V0zM0 9h2v3h3v2H0V9zM12 9h2v5H9v-2h3V9z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M0 0h5v2H2v3H0V0zM9 0h5v5h-2V2H9V0zM0 9h2v3h3v2H0V9zM12 9h2v5H9v-2h3V9z"/>
              </svg>
            )}
          </button>

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
      <div className="flex-1 overflow-hidden relative" style={{ background: "#000" }}>
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
            startOffset={startOffset}
          />
        )}

        {!isLoading && showNextBadge && nextEntry && (
          <div
            className="absolute bottom-6 right-6 z-20"
            style={{
              width: "400px",
              background: "rgba(8,8,8,0.88)",
              backdropFilter: "blur(6px)",
              border: "1px solid var(--tv-border)",
              borderTop: "2px solid var(--tv-accent)",
              padding: "10px 12px",
            }}
          >
            <span
              className="uppercase tracking-wider"
              style={{ fontSize: "10px", color: "var(--tv-muted)" }}
            >
              Далее в программе{" "}
              <span style={{ color: "var(--tv-accent)" }}>
                {THRESHOLD_LABELS[badgeState?.threshold ?? 0] ?? ""}
              </span>
            </span>
            <div className="flex items-center gap-3 mt-2">
              <span
                className="flex-1 line-clamp-2"
                style={{ fontSize: "12px", color: "var(--tv-text)", lineHeight: "1.4" }}
              >
                {nextEntry.video.title}
              </span>
              {nextEntry.video.thumbnailUrl && (
                <Image
                  src={nextEntry.video.thumbnailUrl}
                  width={80}
                  height={45}
                  className="shrink-0 object-cover rounded-sm"
                  alt=""
                />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
