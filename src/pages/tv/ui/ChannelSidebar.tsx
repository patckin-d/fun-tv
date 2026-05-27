"use client";

import type { Channel } from "@/entities/channel";
import { cn } from "@/shared/utils";

const CHANNEL_ICONS: Record<string, string> = {
  standup: "🎤",
  roast: "🔥",
  podcasts: "🎙",
  nostalgia: "📼",
};

interface ChannelSidebarProps {
  channels: Channel[];
  selected: Channel | null;
  onSelect: (channel: Channel) => void;
}

export function ChannelSidebar({ channels, selected, onSelect }: ChannelSidebarProps) {
  return (
    <aside
      className="flex flex-col gap-1 py-4 px-2 w-[72px] shrink-0"
      style={{ borderRight: "1px solid var(--tv-border)" }}
    >
      {channels.map((ch) => {
        const isActive = selected?.id === ch.id;
        return (
          <button
            key={ch.id}
            onClick={() => onSelect(ch)}
            title={ch.title}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg py-3 px-1 text-xs transition-all duration-200",
              isActive
                ? "active-channel-glow text-[var(--tv-accent)]"
                : "text-[var(--tv-muted)] hover:text-[var(--tv-text)]"
            )}
            style={
              isActive
                ? {
                    background: "var(--tv-accent-dim)",
                    borderLeft: "2px solid var(--tv-accent)",
                  }
                : { borderLeft: "2px solid transparent" }
            }
          >
            <span className="text-xl leading-none">
              {CHANNEL_ICONS[ch.slug] ?? "📺"}
            </span>
            <span
              className="leading-tight text-center"
              style={{ fontSize: "9px", letterSpacing: "0.04em" }}
            >
              {ch.title.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
