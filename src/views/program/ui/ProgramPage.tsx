"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSchedule } from "@/entities/schedule";
import type { ScheduleEntry } from "@/entities/schedule";
import { ScheduleItem } from "./ScheduleItem";

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatColHeader(date: Date): { weekday: string; day: string; month: string } {
  return {
    weekday: date.toLocaleDateString("ru-RU", { weekday: "short" }).toUpperCase(),
    day: String(date.getDate()),
    month: date.toLocaleDateString("ru-RU", { month: "long" }),
  };
}

function groupByChannel(entries: ScheduleEntry[]): Record<string, ScheduleEntry[]> {
  return entries.reduce<Record<string, ScheduleEntry[]>>((acc, e) => {
    if (!acc[e.channel.title]) acc[e.channel.title] = [];
    acc[e.channel.title].push(e);
    return acc;
  }, {});
}

export function ProgramPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [scheduleByDay, setScheduleByDay] = useState<Record<string, ScheduleEntry[]>>({});
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const days = [0, 1, 2].map((i) => addDays(startDate, i));

  useEffect(() => {
    setIsLoading(true);
    Promise.all(days.map((d) => getSchedule(localDateStr(d)))).then((results) => {
      const map: Record<string, ScheduleEntry[]> = {};
      days.forEach((d, i) => { map[localDateStr(d)] = results[i]; });
      setScheduleByDay(map);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canGoBack = startDate > today;
  const canGoForward = addDays(startDate, 3) < addDays(today, 7);

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
        <Link
          href="/"
          className="flex items-center gap-2"
          style={{ textDecoration: "none" }}
        >
          <span style={{ color: "var(--tv-muted)", fontSize: "13px" }}>←</span>
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
        </Link>

        {/* Day navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStartDate((d) => addDays(d, -1))}
            disabled={!canGoBack}
            style={{
              background: "none",
              border: "none",
              cursor: canGoBack ? "pointer" : "default",
              color: canGoBack ? "var(--tv-text)" : "var(--tv-border)",
              fontSize: "16px",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ←
          </button>

          <div className="flex gap-1">
            {days.map((day) => {
              const isToday = isSameDay(day, new Date());
              const { weekday, day: d, month } = formatColHeader(day);
              return (
                <div
                  key={localDateStr(day)}
                  className="flex flex-col items-center"
                  style={{
                    minWidth: "90px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: isToday ? "rgba(244,168,41,0.1)" : "transparent",
                    border: isToday ? "1px solid rgba(244,168,41,0.3)" : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      color: isToday ? "var(--tv-accent)" : "var(--tv-muted)",
                    }}
                  >
                    {weekday}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: isToday ? "var(--tv-accent)" : "var(--tv-text)",
                      fontWeight: isToday ? 600 : 400,
                    }}
                  >
                    {d} {month}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStartDate((d) => addDays(d, 1))}
            disabled={!canGoForward}
            style={{
              background: "none",
              border: "none",
              cursor: canGoForward ? "pointer" : "default",
              color: canGoForward ? "var(--tv-text)" : "var(--tv-border)",
              fontSize: "16px",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            →
          </button>
        </div>

        <span style={{ width: "80px" }} />
      </header>

      {/* 3-column schedule grid */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{ borderTop: "1px solid var(--tv-border)" }}
      >
        {days.map((day, colIdx) => {
          const key = localDateStr(day);
          const entries = scheduleByDay[key] ?? [];
          const isToday = isSameDay(day, new Date());
          const byChannel = groupByChannel(entries);

          return (
            <div
              key={key}
              className="flex flex-col flex-1 overflow-hidden"
              style={{
                borderRight: colIdx < 2 ? "1px solid var(--tv-border)" : "none",
                background: isToday ? "rgba(244,168,41,0.02)" : "var(--tv-bg)",
              }}
            >
              {/* Column day header */}
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--tv-border)",
                  background: isToday ? "rgba(244,168,41,0.06)" : "var(--tv-surface)",
                  flexShrink: 0,
                }}
              >
                {isToday && (
                  <span
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      color: "var(--tv-accent)",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    СЕГОДНЯ
                  </span>
                )}
                <span
                  className="uppercase tracking-widest"
                  style={{ fontSize: "11px", color: isToday ? "var(--tv-accent)" : "var(--tv-muted)" }}
                >
                  {formatColHeader(day).weekday},{" "}
                  {formatColHeader(day).day} {formatColHeader(day).month}
                </span>
              </div>

              {/* Entries */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <div
                      className="w-5 h-5 rounded-full border-2 animate-spin"
                      style={{ borderColor: "var(--tv-accent)", borderTopColor: "transparent" }}
                    />
                  </div>
                ) : Object.keys(byChannel).length === 0 ? (
                  <div
                    className="flex items-center justify-center h-24"
                    style={{ color: "var(--tv-muted)", fontSize: "12px" }}
                  >
                    нет передач
                  </div>
                ) : (
                  Object.entries(byChannel).map(([channelTitle, channelEntries]) => (
                    <div key={channelTitle}>
                      <div
                        className="sticky top-0 px-4 py-2"
                        style={{
                          background: isToday ? "rgba(244,168,41,0.04)" : "var(--tv-surface)",
                          borderBottom: "1px solid var(--tv-border)",
                          zIndex: 1,
                        }}
                      >
                        <span
                          className="text-xs uppercase tracking-[0.2em]"
                          style={{ color: "var(--tv-accent)", fontWeight: 600 }}
                        >
                          {channelTitle}
                        </span>
                      </div>

                      {channelEntries.map((entry) => (
                        <ScheduleItem
                          key={entry.id}
                          entry={entry}
                          isLive={
                            isToday &&
                            new Date(entry.startsAt) <= now &&
                            now < new Date(entry.endsAt)
                          }
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
