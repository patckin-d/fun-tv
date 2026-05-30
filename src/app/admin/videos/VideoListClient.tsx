"use client";

import { useState } from "react";
import type { Video } from "@/entities/video";
import { formatDuration } from "@/shared/utils";

interface Props {
  initialVideos: Video[];
}

export function VideoListClient({ initialVideos }: Props) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  async function handleToggleActive(video: Video) {
    const next = !video.isActive;
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, isActive: next } : v)),
    );
    setPendingIds((prev) => new Set(prev).add(video.id));
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const updated = (await res.json()) as Video;
      if (res.ok) {
        setVideos((prev) =>
          prev.map((v) => (v.id === updated.id ? updated : v)),
        );
      } else {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, isActive: video.isActive } : v,
          ),
        );
      }
    } catch {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, isActive: video.isActive } : v,
        ),
      );
    } finally {
      setPendingIds((prev) => {
        const s = new Set(prev);
        s.delete(video.id);
        return s;
      });
    }
  }

  const activeCount = videos.filter((v) => v.isActive).length;

  return (
    <div
      style={{
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--tv-bg)",
        color: "var(--tv-text)",
        fontFamily: "var(--font-geist-mono), monospace",
        position: "relative",
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
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px 32px 20px",
            flexShrink: 0,
            borderBottom: "1px solid var(--tv-border)",
          }}
        >
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
              marginBottom: "12px",
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
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Видеотека
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "12px",
              color: "var(--tv-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {activeCount} активных из {videos.length}
          </p>
        </div>

        {/* Main area: table + optional side panel */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Table */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--tv-border)",
                    position: "sticky",
                    top: 0,
                    background: "var(--tv-bg)",
                    zIndex: 2,
                  }}
                >
                  <th
                    style={{
                      padding: "10px 12px 10px 32px",
                      textAlign: "right",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--tv-muted)",
                      width: "48px",
                    }}
                  >
                    №
                  </th>
                  <th
                    style={{
                      padding: "10px 16px 10px 12px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--tv-muted)",
                    }}
                  >
                    НАЗВАНИЕ
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--tv-muted)",
                      width: "90px",
                    }}
                  >
                    ДЛИТ.
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--tv-muted)",
                      width: "52px",
                    }}
                  >
                    18+
                  </th>
                  <th
                    style={{
                      padding: "10px 32px 10px 16px",
                      textAlign: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "var(--tv-muted)",
                      width: "80px",
                    }}
                  >
                    В ЭФИРЕ
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video, index) => {
                  const isSelected = selectedVideo?.id === video.id;
                  return (
                    <tr
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        background: isSelected
                          ? "rgba(244,168,41,0.06)"
                          : "transparent",
                        borderLeft: isSelected
                          ? "3px solid var(--tv-accent)"
                          : "3px solid transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 12px 12px 29px",
                          fontSize: "11px",
                          textAlign: "right",
                          color: "var(--tv-muted)",
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                          userSelect: "none",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px 12px 12px",
                          fontSize: "13px",
                          maxWidth: "0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--tv-text)",
                        }}
                      >
                        {video.title}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: "12px",
                          fontVariantNumeric: "tabular-nums",
                          color: "var(--tv-accent)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {video.durationSec != null ? (
                          formatDuration(video.durationSec)
                        ) : (
                          <span style={{ color: "var(--tv-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {video.isAgeRestricted && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              padding: "2px 5px",
                              border: "1px solid rgba(255,80,80,0.5)",
                              color: "rgba(255,100,100,0.9)",
                              background: "rgba(255,0,0,0.08)",
                            }}
                          >
                            18+
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 32px 12px 16px",
                          textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: pendingIds.has(video.id)
                              ? "wait"
                              : "pointer",
                            width: "20px",
                            height: "20px",
                            position: "relative",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={video.isActive}
                            onChange={() => handleToggleActive(video)}
                            disabled={pendingIds.has(video.id)}
                            style={{
                              appearance: "none",
                              WebkitAppearance: "none",
                              width: "16px",
                              height: "16px",
                              border: `1px solid ${video.isActive ? "var(--tv-accent)" : "var(--tv-muted)"}`,
                              background: video.isActive
                                ? "var(--tv-accent)"
                                : "transparent",
                              cursor: "inherit",
                              flexShrink: 0,
                              opacity: pendingIds.has(video.id) ? 0.5 : 1,
                              transition:
                                "background 0.15s, border-color 0.15s",
                            }}
                          />
                          {video.isActive && (
                            <span
                              style={{
                                position: "absolute",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#080808",
                                pointerEvents: "none",
                                lineHeight: 1,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Side panel */}
          {selectedVideo && (
            <div
              style={{
                width: "420px",
                flexShrink: 0,
                borderLeft: "1px solid var(--tv-border)",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "16px 16px 12px",
                  borderBottom: "1px solid var(--tv-border)",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "var(--tv-text)",
                    lineHeight: 1.4,
                    letterSpacing: "0.02em",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {selectedVideo.title}
                </p>
                <button
                  onClick={() => setSelectedVideo(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--tv-muted)",
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: 1,
                    padding: "0 2px",
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>

              {/* YouTube player */}
              <div style={{ padding: "12px", flexShrink: 0 }}>
                <iframe
                  key={selectedVideo.videoId}
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    border: "none",
                    display: "block",
                  }}
                />
              </div>

              {/* Video meta */}
              <div
                style={{
                  padding: "0 16px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                {selectedVideo.durationSec != null && (
                  <div style={{ fontSize: "11px", color: "var(--tv-muted)" }}>
                    Длительность:{" "}
                    <span style={{ color: "var(--tv-accent)" }}>
                      {formatDuration(selectedVideo.durationSec)}
                    </span>
                  </div>
                )}
                {selectedVideo.isAgeRestricted && (
                  <span
                    style={{
                      alignSelf: "flex-start",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "2px 5px",
                      border: "1px solid rgba(255,80,80,0.5)",
                      color: "rgba(255,100,100,0.9)",
                      background: "rgba(255,0,0,0.08)",
                    }}
                  >
                    18+
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
