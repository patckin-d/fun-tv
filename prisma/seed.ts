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
  const channels = await Promise.all([
    prisma.channel.upsert({
      where: { slug: "standup" },
      update: {},
      create: {
        slug: "standup",
        title: "Стендап",
        description: "Лучшие стендап-выступления",
        sortOrder: 0,
      },
    }),
    prisma.channel.upsert({
      where: { slug: "roast" },
      update: {},
      create: {
        slug: "roast",
        title: "Прожарка",
        description: "Прожарки и батлы",
        sortOrder: 1,
      },
    }),
    prisma.channel.upsert({
      where: { slug: "podcasts" },
      update: {},
      create: {
        slug: "podcasts",
        title: "Подкасты",
        description: "Длинные разговоры",
        sortOrder: 2,
      },
    }),
    prisma.channel.upsert({
      where: { slug: "nostalgia" },
      update: {},
      create: {
        slug: "nostalgia",
        title: "Ностальгия",
        description: "Классика нулевых и десятых",
        sortOrder: 3,
      },
    }),
  ]);

  // Placeholder — замени videoId на реальные перед деплоем
  await prisma.video.createMany({
    data: [
      {
        title: "Тестовое видео — стендап",
        videoId: "dQw4w9WgXcQ",
        platform: PLATFORM_YOUTUBE,
        durationSec: 212,
        channelId: channels[0].id,
        sortOrder: 0,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed завершён. Каналов:", channels.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
