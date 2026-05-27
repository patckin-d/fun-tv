import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const channels = await prisma.channel.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return Response.json(channels);
}
