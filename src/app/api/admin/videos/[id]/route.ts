import type { NextRequest } from "next/server";
import { prisma } from "@/shared/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { isActive?: boolean };
  try {
    body = await request.json() as { isActive?: boolean };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.isActive !== "boolean") {
    return Response.json({ error: "isActive (boolean) is required" }, { status: 400 });
  }

  try {
    const video = await prisma.video.update({
      where: { id },
      data: { isActive: body.isActive },
    });
    return Response.json(video);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
}
