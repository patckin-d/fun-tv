import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(video);
}
