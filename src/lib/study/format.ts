export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function minutesBetween(startTime: string, endTime: string): number {
  let start = parseHHMM(startTime);
  let end = parseHHMM(endTime);
  if (end <= start) end += 24 * 60;
  return Math.max(1, end - start);
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}h ${pad2(m)}m`;
}

export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

export function to12h(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${pad2(h12)}:${pad2(m)} ${ampm}`;
}

export function formatTimeSlot(start: string, end: string): string {
  return `${to12h(start)} - ${to12h(end)}`;
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthYear(isoMonth: string, year: number): string {
  const monthIndex = Number(isoMonth) - 1;
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function monthKey(d = new Date()): { year: number; month: string } {
  return { year: d.getFullYear(), month: pad2(d.getMonth() + 1) };
}

export function startOfWeek(d = new Date()): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return todayISO(date);
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((db - da) / 86_400_000);
}

export function xpFromMinutes(minutes: number): number {
  return Math.round(minutes * 0.1 * 10) / 10;
}

export function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}

export function xpIntoLevel(totalXp: number): number {
  return totalXp % 100;
}

export function googleCalendarTemplateUrl(input: {
  subject: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): string {
  const start = localToGCal(input.date, input.startTime);
  let endDate = input.date;
  if (parseHHMM(input.endTime) <= parseHHMM(input.startTime)) {
    endDate = addDays(input.date, 1);
  }
  const end = localToGCal(endDate, input.endTime);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Study: ${input.subject}`,
    dates: `${start}/${end}`,
    details: [input.topic, input.notes ?? ""].filter(Boolean).join("\n"),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function localToGCal(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0);
  return (
    `${dt.getUTCFullYear()}${pad2(dt.getUTCMonth() + 1)}${pad2(dt.getUTCDate())}` +
    `T${pad2(dt.getUTCHours())}${pad2(dt.getUTCMinutes())}00Z`
  );
}
