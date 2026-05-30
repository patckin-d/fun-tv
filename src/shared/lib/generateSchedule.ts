const DAY_START_HOUR = 6; // 06:00
const DAY_END_HOUR = 26; // 02:00 next day (24 + 2)

interface VideoSlot {
  id: string;
  durationSec: number | null;
}

interface ScheduleRecord {
  channelId: string;
  videoId: string;
  startsAt: Date;
  endsAt: Date;
}

export function generateContinuousSchedule(
  channelId: string,
  videos: VideoSlot[],
  anchorDate: Date,
  days = 7,
): ScheduleRecord[] {
  if (videos.length === 0) return [];

  const records: ScheduleRecord[] = [];

  for (let d = 0; d < days; d++) {
    const dayBase = new Date(anchorDate.getTime() + d * 86_400_000);
    const dayStart = new Date(dayBase);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(dayBase);
    dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

    let cursor = dayStart.getTime();
    let idx = 0;

    while (true) {
      const video = videos[idx % videos.length];
      const durMs = (video.durationSec ?? 600) * 1000;
      const startsAt = new Date(cursor);
      const endsAt = new Date(cursor + durMs);
      if (endsAt.getTime() > dayEnd.getTime()) break;
      records.push({ channelId, videoId: video.id, startsAt, endsAt });
      cursor = endsAt.getTime();
      idx++;
    }
  }

  return records;
}
