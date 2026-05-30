"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { BulkVideoResult } from "@/app/api/admin/videos/bulk/route";

interface AddResult {
  video: {
    id: string;
    title: string;
    durationSec: number | null;
    thumbnailUrl: string | null;
  };
  scheduleEntriesCreated: number;
}

interface BulkResult {
  results: BulkVideoResult[];
  scheduleEntriesCreated: number;
}

function fmtDuration(sec: number | null | undefined): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AddVideoPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single mode
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<AddResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Bulk mode
  const [bulkInput, setBulkInput] = useState("");
  const [bulkStatus, setBulkStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkErrorMsg, setBulkErrorMsg] = useState("");

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status === "loading") return;

    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: input.trim() }),
      });
      const data = (await res.json()) as AddResult & { error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? `HTTP ${res.status}`);
        setStatus("error");
      } else {
        setResult(data);
        setStatus("success");
        setInput("");
        inputRef.current?.focus();
      }
    } catch {
      setErrorMsg("Сетевая ошибка — проверьте соединение");
      setStatus("error");
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = bulkInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0 || bulkStatus === "loading") return;

    setBulkStatus("loading");
    setBulkResult(null);
    setBulkErrorMsg("");

    try {
      const res = await fetch("/api/admin/videos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: lines }),
      });
      const data = (await res.json()) as BulkResult & { error?: string };
      if (!res.ok) {
        setBulkErrorMsg(data.error ?? `HTTP ${res.status}`);
        setBulkStatus("error");
      } else {
        setBulkResult(data);
        setBulkStatus("success");
        setBulkInput("");
      }
    } catch {
      setBulkErrorMsg("Сетевая ошибка — проверьте соединение");
      setBulkStatus("error");
    }
  }

  const bulkLines = bulkInput.split("\n").filter((l) => l.trim()).length;

  return (
    <div
      style={{
        height: "100%",
        background: "var(--tv-bg)",
        color: "var(--tv-text)",
        fontFamily: "var(--font-geist-mono), monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "48px 16px 80px",
        position: "relative",
        overflowY: "auto",
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "480px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--tv-accent)",
              color: "#080808",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              padding: "3px 10px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#080808",
                animation: "glowPulse 1.6s ease-in-out infinite",
              }}
            />
            УПРАВЛЕНИЕ ЭФИРОМ
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: "var(--tv-text)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Добавить видео
          </h1>
          <p
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "var(--tv-muted)",
              letterSpacing: "0.02em",
              lineHeight: 1.6,
            }}
          >
            {mode === "single" ? (
              <>
                Введите ID видео YouTube или полный URL.
                <br />
                Данные будут получены автоматически.
              </>
            ) : (
              <>
                Введите по одному ID или URL на каждой строке.
                <br />
                Максимум 50 видео за операцию.
              </>
            )}
          </p>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            marginBottom: "24px",
            border: "1px solid var(--tv-border)",
            overflow: "hidden",
          }}
        >
          {(["single", "bulk"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: "8px 0",
                background: mode === m ? "var(--tv-accent)" : "transparent",
                color: mode === m ? "#080808" : "var(--tv-muted)",
                border: "none",
                borderRight:
                  m === "single" ? "1px solid var(--tv-border)" : "none",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {m === "single" ? "ОДИНОЧНОЕ" : "ПАКЕТНОЕ"}
            </button>
          ))}
        </div>

        {/* Single mode form */}
        {mode === "single" && (
          <>
            <form
              onSubmit={handleSingleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--tv-surface, #111)",
                  border: `1px solid ${status === "error" ? "rgba(255,80,80,0.5)" : "var(--tv-border)"}`,
                  transition: "border-color 0.15s",
                }}
              >
                <span
                  style={{
                    padding: "0 12px",
                    color: "var(--tv-accent)",
                    fontSize: "13px",
                    userSelect: "none",
                    flexShrink: 0,
                  }}
                >
                  &gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="dQw4w9WgXcQ или https://youtube.com/…"
                  disabled={status === "loading"}
                  autoFocus
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--tv-text)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    padding: "13px 12px 13px 0",
                    letterSpacing: "0.02em",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || status === "loading"}
                style={{
                  background:
                    status === "loading" ? "transparent" : "var(--tv-accent)",
                  color: status === "loading" ? "var(--tv-muted)" : "#080808",
                  border:
                    status === "loading"
                      ? "1px solid var(--tv-border)"
                      : "1px solid var(--tv-accent)",
                  fontFamily: "inherit",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  padding: "13px 20px",
                  cursor:
                    !input.trim() || status === "loading"
                      ? "not-allowed"
                      : "pointer",
                  transition: "background 0.15s, color 0.15s",
                  alignSelf: "flex-start",
                }}
              >
                {status === "loading" ? "ЗАГРУЗКА…" : "ДОБАВИТЬ"}
              </button>
            </form>

            {status === "error" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  borderLeft: "3px solid rgba(255,80,80,0.7)",
                  background: "rgba(255,80,80,0.05)",
                  fontSize: "12px",
                  color: "rgba(255,120,120,0.9)",
                  letterSpacing: "0.02em",
                  lineHeight: 1.5,
                }}
              >
                {errorMsg}
              </div>
            )}

            {status === "success" && result && (
              <div
                style={{
                  marginTop: "24px",
                  border: "1px solid rgba(244,168,41,0.3)",
                  background: "rgba(244,168,41,0.04)",
                  overflow: "hidden",
                  animation: "channelIn 0.25s ease-out forwards",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "rgba(244,168,41,0.1)",
                    borderBottom: "1px solid rgba(244,168,41,0.15)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--tv-accent)",
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                    }}
                  >
                    ✓ ДОБАВЛЕНО В РАСПИСАНИЕ
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0" }}>
                  {result.video.thumbnailUrl && (
                    <div
                      style={{
                        position: "relative",
                        width: "140px",
                        aspectRatio: "16/9",
                        flexShrink: 0,
                        background: "#000",
                      }}
                    >
                      <Image
                        src={result.video.thumbnailUrl}
                        alt={result.video.title}
                        fill
                        style={{ objectFit: "cover", opacity: 0.85 }}
                        unoptimized
                      />
                    </div>
                  )}

                  <div
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      minWidth: 0,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "var(--tv-text)",
                        lineHeight: 1.35,
                        fontWeight: 500,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {result.video.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        marginTop: "4px",
                      }}
                    >
                      <span
                        style={{ fontSize: "11px", color: "var(--tv-muted)" }}
                      >
                        Длительность:{" "}
                        <span style={{ color: "var(--tv-accent)" }}>
                          {fmtDuration(result.video.durationSec)}
                        </span>
                      </span>
                      <span
                        style={{ fontSize: "11px", color: "var(--tv-muted)" }}
                      >
                        Записей в расписании:{" "}
                        <span style={{ color: "var(--tv-text)" }}>
                          {result.scheduleEntriesCreated}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bulk mode form */}
        {mode === "bulk" && (
          <>
            <form
              onSubmit={handleBulkSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  background: "var(--tv-surface, #111)",
                  border: `1px solid ${bulkStatus === "error" ? "rgba(255,80,80,0.5)" : "var(--tv-border)"}`,
                  transition: "border-color 0.15s",
                }}
              >
                <textarea
                  value={bulkInput}
                  onChange={(e) => {
                    setBulkInput(e.target.value);
                    if (bulkStatus === "error") setBulkStatus("idle");
                  }}
                  placeholder={
                    "dQw4w9WgXcQ\nhttps://youtube.com/watch?v=…\nabc123xyz"
                  }
                  disabled={bulkStatus === "loading"}
                  autoFocus
                  spellCheck={false}
                  rows={8}
                  style={{
                    display: "block",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--tv-text)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    padding: "13px 16px",
                    letterSpacing: "0.02em",
                    resize: "vertical",
                    boxSizing: "border-box",
                    lineHeight: 1.6,
                  }}
                />
                {bulkLines > 0 && (
                  <div
                    style={{
                      padding: "4px 16px 8px",
                      fontSize: "10px",
                      color: "var(--tv-muted)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {bulkLines}{" "}
                    {bulkLines === 1
                      ? "видео"
                      : bulkLines < 5
                        ? "видео"
                        : "видео"}
                    {bulkLines > 50 && (
                      <span
                        style={{
                          color: "rgba(255,80,80,0.8)",
                          marginLeft: "8px",
                        }}
                      >
                        — превышен лимит 50
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  bulkLines === 0 || bulkLines > 50 || bulkStatus === "loading"
                }
                style={{
                  background:
                    bulkStatus === "loading"
                      ? "transparent"
                      : "var(--tv-accent)",
                  color:
                    bulkStatus === "loading" ? "var(--tv-muted)" : "#080808",
                  border:
                    bulkStatus === "loading"
                      ? "1px solid var(--tv-border)"
                      : "1px solid var(--tv-accent)",
                  fontFamily: "inherit",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  padding: "13px 20px",
                  cursor:
                    bulkLines === 0 ||
                    bulkLines > 50 ||
                    bulkStatus === "loading"
                      ? "not-allowed"
                      : "pointer",
                  transition: "background 0.15s, color 0.15s",
                  alignSelf: "flex-start",
                }}
              >
                {bulkStatus === "loading"
                  ? "ЗАГРУЗКА…"
                  : `ДОБАВИТЬ ${bulkLines > 0 ? bulkLines : ""}`}
              </button>
            </form>

            {bulkStatus === "error" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  borderLeft: "3px solid rgba(255,80,80,0.7)",
                  background: "rgba(255,80,80,0.05)",
                  fontSize: "12px",
                  color: "rgba(255,120,120,0.9)",
                  letterSpacing: "0.02em",
                  lineHeight: 1.5,
                }}
              >
                {bulkErrorMsg}
              </div>
            )}

            {bulkStatus === "success" && bulkResult && (
              <div
                style={{
                  marginTop: "24px",
                  border: "1px solid rgba(244,168,41,0.3)",
                  background: "rgba(244,168,41,0.04)",
                  overflow: "hidden",
                  animation: "channelIn 0.25s ease-out forwards",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    background: "rgba(244,168,41,0.1)",
                    borderBottom: "1px solid rgba(244,168,41,0.15)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--tv-accent)",
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                    }}
                  >
                    РЕЗУЛЬТАТЫ ИМПОРТА
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--tv-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    расписание: {bulkResult.scheduleEntriesCreated} записей
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {bulkResult.results.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderBottom:
                          i < bulkResult.results.length - 1
                            ? "1px solid rgba(244,168,41,0.08)"
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          flexShrink: 0,
                          color:
                            item.status === "added"
                              ? "var(--tv-accent)"
                              : item.status === "updated"
                                ? "rgba(120,200,120,0.9)"
                                : "rgba(255,100,100,0.9)",
                        }}
                      >
                        {item.status === "added"
                          ? "+"
                          : item.status === "updated"
                            ? "~"
                            : "✗"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color:
                              item.status === "error"
                                ? "rgba(255,100,100,0.8)"
                                : "var(--tv-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.status === "error" ? item.rawInput : item.title}
                        </p>
                        {item.status === "error" && item.error && (
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: "10px",
                              color: "rgba(255,100,100,0.6)",
                            }}
                          >
                            {item.error}
                          </p>
                        )}
                      </div>
                      {item.status !== "error" && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--tv-muted)",
                            flexShrink: 0,
                          }}
                        >
                          {fmtDuration(item.durationSec)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
