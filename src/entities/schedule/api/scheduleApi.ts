import { fetcher } from "@/shared/api/fetcher";
import type { ScheduleEntry } from "../model/types";

export function getSchedule(date: string): Promise<ScheduleEntry[]> {
  return fetcher<ScheduleEntry[]>(`/api/schedule?date=${date}`);
}
