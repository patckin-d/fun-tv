"use client";

import type { ScheduleEntry } from "@/entities/schedule";

interface ScheduleItemProps {
  entry: ScheduleEntry;
  isLive: boolean;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleItem({ entry, isLive }: ScheduleItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "12px 16px",
        background: isLive ? "rgba(244,168,41,0.06)" : "transparent",
        borderLeft: isLive ? "3px solid rgba(244,168,41,0.4)" : "3px solid transparent",
      }}
    >
      {/* Time */}
      <span
        style={{
          fontVariantNumeric: "tabular-nums",
          fontSize: "13px",
          color: isLive ? "var(--tv-accent)" : "var(--tv-muted)",
          minWidth: "90px",
          flexShrink: 0,
          fontFamily: "var(--font-geist-mono), monospace",
        }}
      >
        {fmt(entry.startsAt)} – {fmt(entry.endsAt)}
      </span>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: "14px",
          color: "var(--tv-text)",
          fontWeight: isLive ? 500 : 400,
        }}
      >
        {entry.video.title}
      </span>

      {/* Badge */}
      {isLive && (
        <span
          style={{
            flexShrink: 0,
            fontSize: "10px",
            letterSpacing: "0.12em",
            color: "#080808",
            background: "var(--tv-accent)",
            padding: "2px 7px",
            borderRadius: "3px",
            fontWeight: 700,
          }}
        >
          В ЭФИРЕ
        </span>
      )}
    </div>
  );
}
