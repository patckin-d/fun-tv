import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const channelId = searchParams.get("channelId");
  const cursor = searchParams.get("cursor") ?? undefined;

  if (!channelId) {
    return Response.json({ error: "channelId is required" }, { status: 400 });
  }

  const take = 20;
  const videos = await prisma.video.findMany({
    where: { channelId, isActive: true },
    orderBy: { sortOrder: "asc" },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const nextCursor =
    videos.length === take ? videos[videos.length - 1].id : null;
  return Response.json({ videos, nextCursor });
}
