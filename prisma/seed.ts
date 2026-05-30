import { config } from "dotenv";
config({ path: ".env.local", override: true });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Platform } from "../src/generated/prisma/enums";
import { generateContinuousSchedule } from "../src/shared/lib/generateSchedule";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const PLATFORM_YOUTUBE: Platform = "YOUTUBE";

function parseIso8601Duration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return +(m[1] ?? 0) * 3600 + +(m[2] ?? 0) * 60 + +(m[3] ?? 0);
}

async function fetchYoutubeInfo(videoId: string, apiKey: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    items?: Array<{
      snippet: {
        title: string;
        thumbnails?: { high?: { url: string }; default?: { url: string } };
      };
      contentDetails: { duration: string };
    }>;
  };
  const item = data.items?.[0];
  if (!item) throw new Error(`YouTube video not found: ${videoId}`);
  return {
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ??
      null,
    durationSec: parseIso8601Duration(item.contentDetails.duration),
  };
}

const VIDEO_IDS = [
  "IZ4Obq31UTA",
  "T3iS6rkc3M8",
  "HWkSoF0OgoM",
  "y93v9KFFNPw",
  "_QeBvc12BaM",
  "MEmpjabYzQY",
  "nS_Sb2qLLhY",
];

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  // Remove legacy channels
  await prisma.channel.deleteMany({
    where: { slug: { in: ["standup", "roast", "podcasts", "nostalgia"] } },
  });

  const perviyKanal = await prisma.channel.upsert({
    where: { slug: "perviy-kanal" },
    update: {},
    create: {
      slug: "perviy-kanal",
      title: "Первый канал",
      description: "Программа трансляций",
      sortOrder: 0,
    },
  });

  // Delete old videos no longer in the playlist
  await prisma.video.deleteMany({
    where: {
      channelId: perviyKanal.id,
      videoId: { notIn: VIDEO_IDS },
    },
  });

  // Upsert each video with real data from YouTube API
  for (let i = 0; i < VIDEO_IDS.length; i++) {
    const videoId = VIDEO_IDS[i];
    console.log(`Fetching YouTube info for ${videoId}…`);
    const info = await fetchYoutubeInfo(videoId, apiKey);
    console.log(`  → ${info.title} (${info.durationSec}s)`);

    const existing = await prisma.video.findFirst({
      where: { videoId, channelId: perviyKanal.id },
    });
    if (existing) {
      await prisma.video.update({
        where: { id: existing.id },
        data: {
          title: info.title,
          thumbnailUrl: info.thumbnailUrl,
          durationSec: info.durationSec,
          sortOrder: i,
        },
      });
    } else {
      await prisma.video.create({
        data: {
          videoId,
          platform: PLATFORM_YOUTUBE,
          channelId: perviyKanal.id,
          title: info.title,
          thumbnailUrl: info.thumbnailUrl,
          durationSec: info.durationSec,
          sortOrder: i,
        },
      });
    }
  }

  const videos = await prisma.video.findMany({
    where: { channelId: perviyKanal.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduleData = generateContinuousSchedule(
    perviyKanal.id,
    videos,
    today,
    7,
  );

  await prisma.scheduleEntry.deleteMany({
    where: { channelId: perviyKanal.id },
  });
  await prisma.scheduleEntry.createMany({ data: scheduleData });

  console.log(
    `\nСид завершён. Канал: ${perviyKanal.title}, видео: ${videos.length}, записей расписания: ${scheduleData.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
