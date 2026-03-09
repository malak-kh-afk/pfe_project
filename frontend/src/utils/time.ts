export type Lang = "en" | "fr";
import { langToLocale } from "../i18n";

export function isSameDay(a: number, b: number) {
  const A = new Date(a),
    B = new Date(b);
  return (
    A.getFullYear() === B.getFullYear() &&
    A.getMonth() === B.getMonth() &&
    A.getDate() === B.getDate()
  );
}

export function dayLabel(ts: number, lang: Lang, todayLabel: string, yesterdayLabel: string) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (isSameDay(ts, today.getTime())) return todayLabel;
  if (isSameDay(ts, yesterday.getTime())) return yesterdayLabel;
  return d.toLocaleDateString(langToLocale(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeLabel(ts: number, lang: Lang) {
  return new Date(ts).toLocaleTimeString(langToLocale(lang), {
    hour: "2-digit",
    minute: "2-digit",
  });
}