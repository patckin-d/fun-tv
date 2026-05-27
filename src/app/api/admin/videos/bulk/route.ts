import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { generateContinuousSchedule } from "@/shared/lib/generateSchedule";

function parseIso8601Duration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
}

function extractVideoId(input: string): string {
  try {
    const url = new URL(input);
    return url.searchParams.get("v") ?? input;
  } catch {
    return input.trim();
  }
}

type YtItem = {
  id: string;
  snippet: {
    title: string;
    thumbnails?: { high?: { url: string }; default?: { url: string } };
  };
  contentDetails: {
    duration: string;
    contentRating?: { ytRating?: string };
  };
};

export type BulkVideoResult = {
  rawInput: string;
  videoId: string;
  status: "added" | "updated" | "error";
  title?: string;
  durationSec?: number | null;
  thumbnailUrl?: string | null;
  error?: string;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  let body: { videoIds?: string[] };
  try {
    body = (await request.json()) as { videoIds?: string[] };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawInputs = body.videoIds?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (rawInputs.length === 0) {
    return Response.json({ error: "videoIds array is required" }, { status: 400 });
  }
  if (rawInputs.length > 50) {
    return Response.json({ error: "Maximum 50 videos per bulk operation" }, { status: 400 });
  }

  const parsed = rawInputs.map((raw) => ({ raw, videoId: extractVideoId(raw) }));
  const ids = parsed.map((p) => p.videoId).join(",");

  const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids}&key=${apiKey}`;
  let ytItems: Map<string, YtItem>;
  try {
    const res = await fetch(ytUrl);
    const data = (await res.json()) as { items?: YtItem[] };
    ytItems = new Map((data.items ?? []).map((item) => [item.id, item]));
  } catch {
    return Response.json({ error: "Failed to reach YouTube API" }, { status: 502 });
  }

  const channel = await prisma.channel.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!channel) {
    return Response.json({ error: "No active channel found" }, { status: 500 });
  }

  let maxOrder =
    (
      await prisma.video.aggregate({
        where: { channelId: channel.id },
        _max: { sortOrder: true },
      })
    )._max.sortOrder ?? -1;

  const results: BulkVideoResult[] = [];

  for (const { raw, videoId } of parsed) {
    const ytItem = ytItems.get(videoId);
    if (!ytItem) {
      results.push({ rawInput: raw, videoId, status: "error", error: "Видео не найдено на YouTube" });
      continue;
    }

    const title = ytItem.snippet.title;
    const thumbnailUrl =
      ytItem.snippet.thumbnails?.high?.url ?? ytItem.snippet.thumbnails?.default?.url ?? null;
    const durationSec = parseIso8601Duration(ytItem.contentDetails.duration);
    const isAgeRestricted = ytItem.contentDetails.contentRating?.ytRating === "ytAgeRestricted";

    const existing = await prisma.video.findFirst({ where: { videoId, channelId: channel.id } });

    if (existing) {
      await prisma.video.update({
        where: { id: existing.id },
        data: { title, thumbnailUrl, durationSec, isAgeRestricted },
      });
      results.push({ rawInput: raw, videoId, status: "updated", title, durationSec, thumbnailUrl });
    } else {
      maxOrder++;
      await prisma.video.create({
        data: {
          videoId,
          platform: "YOUTUBE",
          channelId: channel.id,
          title,
          thumbnailUrl,
          durationSec,
          isAgeRestricted,
          sortOrder: maxOrder,
        },
      });
      results.push({ rawInput: raw, videoId, status: "added", title, durationSec, thumbnailUrl });
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const allVideos = await prisma.video.findMany({
    where: { channelId: channel.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const scheduleData = generateContinuousSchedule(channel.id, allVideos, tomorrow, 7);

  await prisma.scheduleEntry.deleteMany({
    where: { channelId: channel.id, startsAt: { gte: tomorrow } },
  });
  await prisma.scheduleEntry.createMany({ data: scheduleData });

  return Response.json({ results, scheduleEntriesCreated: scheduleData.length });
}
