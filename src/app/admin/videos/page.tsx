import { prisma } from "@/shared/lib/prisma";
import { VideoListClient } from "./VideoListClient";

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({ orderBy: { title: "asc" } });
  return <VideoListClient initialVideos={videos} />;
}
