import type { Banner } from "../rules";
import type { SessionFields } from "../campusCoach/week";

export type HomeWeekDay = {
  localDate: string;
  weekday: string;
  weekdayShort: string;
  isToday: boolean;
  storedText: string;
  displayText: string;
  fromMirror: boolean;
  session: SessionFields;
};

export type { Banner, SessionFields };
