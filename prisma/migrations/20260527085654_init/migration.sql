-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'VK');

-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'YOUTUBE',
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER,
    "channelId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_slug_key" ON "channels"("slug");

-- CreateIndex
CREATE INDEX "channels_isActive_sortOrder_idx" ON "channels"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "videos_channelId_isActive_sortOrder_idx" ON "videos"("channelId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "videos_channelId_isActive_idx" ON "videos"("channelId", "isActive");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
