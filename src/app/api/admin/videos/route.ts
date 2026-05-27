import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { generateContinuousSchedule } from "@/shared/lib/generateSchedule";

function parseIso8601Duration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + (+(m[3] ?? 0));
}

function extractVideoId(input: string): string {
  // Accept bare ID or full YouTube URL
  try {
    const url = new URL(input);
    return url.searchParams.get("v") ?? input;
  } catch {
    return input.trim();
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  let body: { videoId?: string };
  try {
    body = await request.json() as { videoId?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawInput = body.videoId?.trim();
  if (!rawInput) {
    return Response.json({ error: "videoId is required" }, { status: 400 });
  }
  const videoId = extractVideoId(rawInput);

  // Fetch info from YouTube
  const ytUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
  let ytData: {
    items?: Array<{
      snippet: { title: string; thumbnails?: { high?: { url: string }; default?: { url: string } } };
      contentDetails: { duration: string; contentRating?: { ytRating?: string } };
    }>;
  };
  try {
    const res = await fetch(ytUrl);
    ytData = await res.json() as typeof ytData;
  } catch {
    return Response.json({ error: "Failed to reach YouTube API" }, { status: 502 });
  }

  const item = ytData.items?.[0];
  if (!item) {
    return Response.json({ error: `Video not found on YouTube: ${videoId}` }, { status: 404 });
  }

  const title = item.snippet.title;
  const thumbnailUrl =
    item.snippet.thumbnails?.high?.url ??
    item.snippet.thumbnails?.default?.url ??
    null;
  const durationSec = parseIso8601Duration(item.contentDetails.duration);
  const isAgeRestricted = item.contentDetails.contentRating?.ytRating === "ytAgeRestricted";

  // Find the default channel
  const channel = await prisma.channel.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!channel) {
    return Response.json({ error: "No active channel found" }, { status: 500 });
  }

  // Check if video already exists for this channel
  const existing = await prisma.video.findFirst({
    where: { videoId, channelId: channel.id },
  });

  let video;
  if (existing) {
    video = await prisma.video.update({
      where: { id: existing.id },
      data: { title, thumbnailUrl, durationSec, isAgeRestricted },
    });
  } else {
    const maxOrder = await prisma.video.aggregate({
      where: { channelId: channel.id },
      _max: { sortOrder: true },
    });
    video = await prisma.video.create({
      data: {
        videoId,
        platform: "YOUTUBE",
        channelId: channel.id,
        title,
        thumbnailUrl,
        durationSec,
        isAgeRestricted,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  // Regenerate schedule starting from tomorrow (don't disturb today's live schedule)
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

  return Response.json({
    video: { id: video.id, title: video.title, durationSec: video.durationSec, thumbnailUrl: video.thumbnailUrl },
    scheduleEntriesCreated: scheduleData.length,
  });
}
