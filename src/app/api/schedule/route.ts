import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "date is required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(`${date}T23:59:59.999Z`);

  const entries = await prisma.scheduleEntry.findMany({
    where: { startsAt: { gte: from, lte: to } },
    orderBy: [{ channelId: "asc" }, { startsAt: "asc" }],
    include: {
      channel: { select: { title: true } },
      video: {
        select: {
          id: true,
          title: true,
          videoId: true,
          thumbnailUrl: true,
          durationSec: true,
        },
      },
    },
  });

  return Response.json(entries);
}
