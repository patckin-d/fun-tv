import { config } from "dotenv";
config({ path: ".env.local", override: true });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Platform } from "../src/generated/prisma/enums";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const PLATFORM_YOUTUBE: Platform = "YOUTUBE";

async function main() {
  // Remove legacy channels that are no longer used
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

  const videoDefs = [
    { videoId: "jidRVb9L4fk", title: "Видео 1 — Первый канал", durationSec: 600, sortOrder: 0 },
    { videoId: "y93v9KFFNPw", title: "Видео 2 — Первый канал", durationSec: 900, sortOrder: 1 },
    { videoId: "JRgnjHqii-k", title: "Видео 3 — Первый канал", durationSec: 1200, sortOrder: 2 },
  ];

  const existingVideoIds = new Set(
    (await prisma.video.findMany({ where: { channelId: perviyKanal.id }, select: { videoId: true } }))
      .map((v) => v.videoId)
  );

  await prisma.video.createMany({
    data: videoDefs
      .filter((v) => !existingVideoIds.has(v.videoId))
      .map((v) => ({ ...v, platform: PLATFORM_YOUTUBE, channelId: perviyKanal.id })),
    skipDuplicates: true,
  });

  const videos = await prisma.video.findMany({
    where: { channelId: perviyKanal.id },
    orderBy: { sortOrder: "asc" },
  });

  // Weekly schedule: 4 blocks per day × 3 videos × 7 days = 84 entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const blockHours = [10, 14, 18, 21];

  const scheduleData: {
    channelId: string;
    videoId: string;
    startsAt: Date;
    endsAt: Date;
  }[] = [];

  for (let day = 0; day < 7; day++) {
    const dayBase = new Date(today.getTime() + day * 24 * 60 * 60 * 1000);

    for (const hour of blockHours) {
      const blockStart = new Date(dayBase);
      blockStart.setHours(hour, 0, 0, 0);

      let cursor = blockStart.getTime();
      for (const video of videos) {
        const startsAt = new Date(cursor);
        const endsAt = new Date(cursor + (video.durationSec ?? 600) * 1000);
        scheduleData.push({ channelId: perviyKanal.id, videoId: video.id, startsAt, endsAt });
        cursor = endsAt.getTime();
      }
    }
  }

  await prisma.scheduleEntry.deleteMany({ where: { channelId: perviyKanal.id } });
  await prisma.scheduleEntry.createMany({ data: scheduleData });

  console.log("Seed завершён.");
  console.log(`Канал: ${perviyKanal.title}, видео: ${videos.length}, записей расписания: ${scheduleData.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
