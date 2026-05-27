export type ScheduleEntryVideo = {
  id: string;
  title: string;
  videoId: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
};

export type ScheduleEntryChannel = {
  title: string;
};

export type ScheduleEntry = {
  id: string;
  channelId: string;
  videoId: string;
  startsAt: string;
  endsAt: string;
  channel: ScheduleEntryChannel;
  video: ScheduleEntryVideo;
};
