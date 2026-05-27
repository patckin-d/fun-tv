"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface AddResult {
  video: {
    id: string;
    title: string;
    durationSec: number | null;
    thumbnailUrl: string | null;
  };
  scheduleEntriesCreated: number;
}

function fmtDuration(sec: number | null): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AddVideoPage() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<AddResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
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
      const data = await res.json() as AddResult & { error?: string };
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

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "480px" }}>
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
            Введите ID видео YouTube или полный URL.
            <br />
            Данные будут получены автоматически.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
              background: status === "loading" ? "transparent" : "var(--tv-accent)",
              color: status === "loading" ? "var(--tv-muted)" : "#080808",
              border: status === "loading" ? "1px solid var(--tv-border)" : "1px solid var(--tv-accent)",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "13px 20px",
              cursor: !input.trim() || status === "loading" ? "not-allowed" : "pointer",
              transition: "background 0.15s, color 0.15s",
              alignSelf: "flex-start",
            }}
          >
            {status === "loading" ? "ЗАГРУЗКА…" : "ДОБАВИТЬ"}
          </button>
        </form>

        {/* Error */}
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

        {/* Success result card */}
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
              <span style={{ fontSize: "10px", color: "var(--tv-accent)", letterSpacing: "0.14em", fontWeight: 700 }}>
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

              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "var(--tv-muted)" }}>
                    Длительность:{" "}
                    <span style={{ color: "var(--tv-accent)" }}>{fmtDuration(result.video.durationSec)}</span>
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--tv-muted)" }}>
                    Записей в расписании:{" "}
                    <span style={{ color: "var(--tv-text)" }}>{result.scheduleEntriesCreated}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
