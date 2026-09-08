import {
  displayCampusCoachText,
  isCampusCoachMirror,
  parseCampusCoachFields,
  type SessionFields,
} from "../campusCoach/week";
import { loadPlannedDays, loadToday, type TodayPayload } from "../store";
import { formatWeekdayFr, parisDate, parisWeekDates } from "../time";
import { sessionFlagsOnCard } from "./sessionFlags";
import type { HomeWeekDay } from "./types";
import type { Banner } from "../rules";

export type { HomeWeekDay } from "./types";

export type HomePayload = TodayPayload & {
  session: SessionFields;
  displayText: string;
  storedText: string;
  fromMirror: boolean;
  week: HomeWeekDay[];
  sessionFlags: Banner[];
};

export async function loadHome(localDate = parisDate()): Promise<HomePayload> {
  const today = await loadToday(localDate);
  const dates = parisWeekDates(localDate);
  const planned = await loadPlannedDays(dates);
  const week: HomeWeekDay[] = dates.map((d) => {
    const storedText = planned.get(d)?.campus_coach_text ?? "";
    const displayText = displayCampusCoachText(d, storedText);
    return {
      localDate: d,
      weekday: formatWeekdayFr(d),
      weekdayShort: formatWeekdayFr(d).slice(0, 3),
      isToday: d === localDate,
      storedText,
      displayText,
      fromMirror: isCampusCoachMirror(storedText),
      session: parseCampusCoachFields(displayText),
    };
  });
  const hero = week.find((d) => d.isToday) ?? week[0];
  return {
    ...today,
    session: hero.session,
    displayText: hero.displayText,
    storedText: hero.storedText,
    fromMirror: hero.fromMirror,
    week,
    sessionFlags: sessionFlagsOnCard(today.evaluation.banners),
  };
}
