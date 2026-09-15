import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  ConnectorType,
  GoogleCalendarTools,
} from "@/lib/app-data";
import { classifyCallToolError } from "@/lib/app-data/errors";
import { BADGE_MAP, quoteForDate } from "./achievements";
import {
  addDays,
  daysBetween,
  googleCalendarTemplateUrl,
  levelFromXp,
  minutesBetween,
  monthKey,
  parseHHMM,
  startOfWeek,
  todayISO,
  xpFromMinutes,
} from "./format";
import type {
  Achievement,
  AnalyticsPayload,
  CalendarEvent,
  CalendarSyncResult,
  CreateSessionInput,
  DailyReport,
  DashboardPayload,
  MonthlyReport,
  StudyProfile,
  StudySession,
  SubjectTotal,
  ThemeMode,
} from "./types";

type ProfileRow = {
  user_id: string;
  total_xp: number | string;
  level: number;
  streak: number;
  max_streak: number;
  last_study_date: string | null;
  theme: string;
  goal_hours: number | string;
};

type SessionRow = {
  id: number;
  subject: string;
  topic: string;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  rating: number | null;
  notes: string;
  source: string;
  calendar_synced: boolean;
  created_at: string;
};

type AchievementRow = {
  badge_id: string;
  name: string;
  unlocked_at: string;
};

function num(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapProfile(row: ProfileRow): StudyProfile {
  return {
    userId: row.user_id,
    totalXp: num(row.total_xp),
    level: row.level,
    streak: row.streak,
    maxStreak: row.max_streak,
    lastStudyDate: row.last_study_date,
    theme: row.theme === "light" ? "light" : "dark",
    goalHours: num(row.goal_hours),
  };
}

function mapSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    rating: row.rating,
    notes: row.notes ?? "",
    source: (row.source as StudySession["source"]) ?? "form",
    calendarSynced: Boolean(row.calendar_synced),
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
  };
}

function mapAchievement(row: AchievementRow): Achievement {
  return {
    badgeId: row.badge_id,
    name: row.name,
    unlockedAt:
      typeof row.unlocked_at === "string"
        ? row.unlocked_at
        : new Date(row.unlocked_at).toISOString(),
  };
}

async function ensureProfile(userId: string): Promise<StudyProfile> {
  const sql = await getSql();
  await sql`
    insert into study_profiles (user_id)
    values (${userId})
    on conflict (user_id) do nothing
  `;
  const rows = await sql<ProfileRow>`
    select user_id, total_xp, level, streak, max_streak, last_study_date, theme, goal_hours
    from study_profiles
    where user_id = ${userId}
  `;
  const row = rows[0];
  if (!row) {
    return {
      userId,
      totalXp: 0,
      level: 1,
      streak: 0,
      maxStreak: 0,
      lastStudyDate: null,
      theme: "dark",
      goalHours: 40,
    };
  }
  return mapProfile(row);
}

function nextStreak(lastStudyDate: string | null, sessionDate: string): number {
  if (!lastStudyDate) return 1;
  if (lastStudyDate === sessionDate) return 0;
  const gap = daysBetween(lastStudyDate, sessionDate);
  if (gap === 1) return 1;
  if (gap < 0) return 0;
  return -1;
}

function isNightOwl(startTime: string, endTime: string): boolean {
  const start = parseHHMM(startTime);
  const end = parseHHMM(endTime);
  return start >= 22 * 60 || end >= 22 * 60 || start < 5 * 60;
}

async function unlockBadge(
  userId: string,
  badgeId: string,
): Promise<Achievement | null> {
  const def = BADGE_MAP[badgeId];
  if (!def) return null;
  const sql = await getSql();
  const existing = await sql<AchievementRow>`
    select badge_id, name, unlocked_at from study_achievements
    where user_id = ${userId} and badge_id = ${badgeId}
  `;
  if (existing[0]) return null;
  const inserted = await sql<AchievementRow>`
    insert into study_achievements (user_id, badge_id, name)
    values (${userId}, ${badgeId}, ${def.name})
    on conflict (user_id, badge_id) do nothing
    returning badge_id, name, unlocked_at
  `;
  return inserted[0] ? mapAchievement(inserted[0]) : null;
}

async function evaluateAchievements(input: {
  userId: string;
  profile: StudyProfile;
  session: { startTime: string; endTime: string; sessionDate: string };
}): Promise<Achievement[]> {
  const sql = await getSql();
  const unlocked: Achievement[] = [];
  const first = await unlockBadge(input.userId, "first_session");
  if (first) unlocked.push(first);
  if (input.profile.streak >= 7) {
    const badge = await unlockBadge(input.userId, "streak_7");
    if (badge) unlocked.push(badge);
  }
  const totals = await sql<{ minutes: number | string }>`
    select coalesce(sum(duration_minutes), 0) as minutes
    from study_sessions where user_id = ${input.userId}
  `;
  if (num(totals[0]?.minutes) >= 50 * 60) {
    const badge = await unlockBadge(input.userId, "hours_50");
    if (badge) unlocked.push(badge);
  }
  if (isNightOwl(input.session.startTime, input.session.endTime)) {
    const badge = await unlockBadge(input.userId, "night_owl");
    if (badge) unlocked.push(badge);
  }
  const weekStart = todayISO(startOfWeek(new Date(`${input.session.sessionDate}T12:00:00`)));
  const days = await sql<{ session_date: string }>`
    select distinct session_date from study_sessions
    where user_id = ${input.userId}
      and session_date >= ${weekStart}::date
      and session_date <= ${input.session.sessionDate}::date
  `;
  const weekDay = new Date(`${input.session.sessionDate}T12:00:00`).getDay();
  const expected = weekDay === 0 ? 7 : weekDay;
  if (days.length >= expected && expected === 7) {
    const badge = await unlockBadge(input.userId, "perfect_week");
    if (badge) unlocked.push(badge);
  }
  return unlocked;
}

function validateSession(input: CreateSessionInput): CreateSessionInput {
  const subject = input.subject.trim().slice(0, 80);
  const topic = input.topic.trim().slice(0, 120);
  if (!subject) throw new Error("Subject is required");
  if (!topic) throw new Error("Topic is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Invalid date");
  if (!/^\d{2}:\d{2}$/.test(input.startTime)) throw new Error("Invalid start time");
  if (!/^\d{2}:\d{2}$/.test(input.endTime)) throw new Error("Invalid end time");
  const rating =
    input.rating == null || Number.isNaN(Number(input.rating))
      ? null
      : Math.min(5, Math.max(1, Math.round(Number(input.rating))));
  return {
    subject,
    topic,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    rating,
    notes: (input.notes ?? "").trim().slice(0, 600),
    source: input.source ?? "form",
  };
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardPayload> => {
    const sql = await getSql();
    const profile = await ensureProfile(context.userId);
    const today = todayISO();
    const week = todayISO(startOfWeek());
    const { year, month } = monthKey();
    const monthStart = `${year}-${month}-01`;

    const recentRows = await sql<SessionRow>`
      select id, subject, topic, session_date, start_time, end_time, duration_minutes,
             rating, notes, source, calendar_synced, created_at
      from study_sessions
      where user_id = ${context.userId}
      order by session_date desc, start_time desc
      limit 12
    `;
    const todayRow = await sql<{ minutes: number | string }>`
      select coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions
      where user_id = ${context.userId} and session_date = ${today}::date
    `;
    const weekRow = await sql<{ minutes: number | string }>`
      select coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions
      where user_id = ${context.userId} and session_date >= ${week}::date
    `;
    const monthRow = await sql<{ minutes: number | string }>`
      select coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions
      where user_id = ${context.userId} and session_date >= ${monthStart}::date
    `;
    const achievementRows = await sql<AchievementRow>`
      select badge_id, name, unlocked_at
      from study_achievements
      where user_id = ${context.userId}
      order by unlocked_at desc
    `;

    return {
      profile,
      todayMinutes: num(todayRow[0]?.minutes),
      weekMinutes: num(weekRow[0]?.minutes),
      monthMinutes: num(monthRow[0]?.minutes),
      recent: recentRows.map(mapSession),
      achievements: achievementRows.map(mapAchievement),
      newBadges: [],
      pendingOffline: 0,
    };
  });

export const createSession = createServerFn({ method: "POST" })
  .validator((data: CreateSessionInput) => validateSession(data))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await ensureProfile(context.userId);
    const duration = minutesBetween(data.startTime, data.endTime);
    const xpGain = xpFromMinutes(duration);
    const streakDelta = nextStreak(profile.lastStudyDate, data.date);
    let streak = profile.streak;
    if (streakDelta === 1) streak = profile.streak + 1;
    else if (streakDelta === -1) streak = 1;
    else if (streakDelta === 0) streak = Math.max(profile.streak, 1);
    if (profile.streak === 0 && streakDelta !== 0) streak = 1;

    const totalXp = Math.round((profile.totalXp + xpGain) * 10) / 10;
    const level = levelFromXp(totalXp);
    const maxStreak = Math.max(profile.maxStreak, streak);

    const inserted = await sql<SessionRow>`
      insert into study_sessions (
        user_id, subject, topic, session_date, start_time, end_time,
        duration_minutes, rating, notes, source
      ) values (
        ${context.userId}, ${data.subject}, ${data.topic}, ${data.date}::date,
        ${data.startTime}, ${data.endTime}, ${duration}, ${data.rating},
        ${data.notes ?? ""}, ${data.source ?? "form"}
      )
      returning id, subject, topic, session_date, start_time, end_time, duration_minutes,
                rating, notes, source, calendar_synced, created_at
    `;

    await sql`
      update study_profiles
      set total_xp = ${totalXp},
          level = ${level},
          streak = ${streak},
          max_streak = ${maxStreak},
          last_study_date = ${data.date}::date,
          updated_at = now()
      where user_id = ${context.userId}
    `;

    const nextProfile = await ensureProfile(context.userId);
    const newBadges = await evaluateAchievements({
      userId: context.userId,
      profile: nextProfile,
      session: {
        startTime: data.startTime,
        endTime: data.endTime,
        sessionDate: data.date,
      },
    });

    return {
      session: inserted[0] ? mapSession(inserted[0]) : null,
      profile: nextProfile,
      xpGain,
      newBadges,
    };
  });

export const listSessions = createServerFn({ method: "GET" })
  .validator((data?: { limit?: number }) => ({
    limit: Math.min(200, Math.max(1, data?.limit ?? 80)),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<SessionRow>`
      select id, subject, topic, session_date, start_time, end_time, duration_minutes,
             rating, notes, source, calendar_synced, created_at
      from study_sessions
      where user_id = ${context.userId}
      order by session_date desc, start_time desc
      limit ${data.limit}
    `;
    return rows.map(mapSession);
  });

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<AnalyticsPayload> => {
    const sql = await getSql();
    const profile = await ensureProfile(context.userId);
    const today = todayISO();
    const startHeat = addDays(today, -140);
    const week = todayISO(startOfWeek());
    const { year, month } = monthKey();
    const monthStart = `${year}-${month}-01`;

    const heatRows = await sql<{ day: string; minutes: number | string }>`
      select session_date as day, coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions
      where user_id = ${context.userId} and session_date >= ${startHeat}::date
      group by session_date
      order by session_date
    `;
    const weekRows = await sql<{ day: string; minutes: number | string }>`
      select session_date as day, coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions
      where user_id = ${context.userId} and session_date >= ${week}::date
      group by session_date
      order by session_date
    `;
    const monthRows = await sql<{ day: string; minutes: number | string }>`
      select session_date as day, coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions
      where user_id = ${context.userId} and session_date >= ${monthStart}::date
      group by session_date
      order by session_date
    `;
    const subjectRows = await sql<{
      subject: string;
      minutes: number | string;
      sessions: number | string;
    }>`
      select subject,
             coalesce(sum(duration_minutes), 0) as minutes,
             count(*) as sessions
      from study_sessions
      where user_id = ${context.userId}
      group by subject
      order by minutes desc
    `;
    const totalRow = await sql<{ minutes: number | string }>`
      select coalesce(sum(duration_minutes), 0) as minutes
      from study_sessions where user_id = ${context.userId}
    `;
    const monthMinutes = monthRows.reduce((acc, row) => acc + num(row.minutes), 0);
    const dayCount = Math.max(1, new Date().getDate());

    return {
      heatmap: heatRows.map((r) => ({ date: r.day, minutes: num(r.minutes) })),
      weekly: weekRows.map((r) => ({ date: r.day, minutes: num(r.minutes) })),
      monthly: monthRows.map((r) => ({ date: r.day, minutes: num(r.minutes) })),
      subjects: subjectRows.map((r) => ({
        subject: r.subject,
        minutes: num(r.minutes),
        sessions: num(r.sessions),
      })),
      goalHours: profile.goalHours,
      monthMinutes,
      totalMinutes: num(totalRow[0]?.minutes),
      avgPerDay: monthMinutes / dayCount,
      streak: profile.streak,
      maxStreak: profile.maxStreak,
      level: profile.level,
      totalXp: profile.totalXp,
    };
  });

export const getReports = createServerFn({ method: "GET" })
  .validator((data: { range: "daily" | "monthly"; date?: string }) => ({
    range: data.range === "monthly" ? ("monthly" as const) : ("daily" as const),
    date: data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : todayISO(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ daily: DailyReport; monthly: MonthlyReport }> => {
    const sql = await getSql();
    const profile = await ensureProfile(context.userId);
    const date = data.date;
    const [yearStr, monthStr] = date.split("-");
    const year = Number(yearStr);
    const monthStart = `${yearStr}-${monthStr}-01`;
    const nextMonth =
      Number(monthStr) === 12
        ? `${year + 1}-01-01`
        : `${yearStr}-${String(Number(monthStr) + 1).padStart(2, "0")}-01`;

    const dayRows = await sql<SessionRow>`
      select id, subject, topic, session_date, start_time, end_time, duration_minutes,
             rating, notes, source, calendar_synced, created_at
      from study_sessions
      where user_id = ${context.userId} and session_date = ${date}::date
      order by start_time
    `;
    const daySessions = dayRows.map(mapSession);
    const daySubjects = rollupSubjects(daySessions);

    const monthSessionRows = await sql<SessionRow>`
      select id, subject, topic, session_date, start_time, end_time, duration_minutes,
             rating, notes, source, calendar_synced, created_at
      from study_sessions
      where user_id = ${context.userId}
        and session_date >= ${monthStart}::date
        and session_date < ${nextMonth}::date
      order by session_date, start_time
    `;
    const monthSessions = monthSessionRows.map(mapSession);
    const monthSubjects = rollupSubjects(monthSessions);
    const monthMinutes = monthSessions.reduce((a, s) => a + s.durationMinutes, 0);
    const daysInMonth = new Date(year, Number(monthStr), 0).getDate();
    const elapsed = Math.min(new Date().getDate(), daysInMonth);
    const heatMap = new Map<string, number>();
    for (const s of monthSessions) {
      heatMap.set(s.sessionDate, (heatMap.get(s.sessionDate) ?? 0) + s.durationMinutes);
    }

    const daily: DailyReport = {
      date,
      totalMinutes: daySessions.reduce((a, s) => a + s.durationMinutes, 0),
      streak: profile.streak,
      level: profile.level,
      sessions: daySessions,
      subjects: daySubjects,
      quote: quoteForDate(date),
    };

    const monthly: MonthlyReport = {
      month: monthStr ?? "01",
      year,
      totalMinutes: monthMinutes,
      avgPerDay: monthMinutes / Math.max(1, elapsed),
      goalHours: profile.goalHours,
      goalPct: profile.goalHours > 0 ? (monthMinutes / 60 / profile.goalHours) * 100 : 0,
      maxStreak: profile.maxStreak,
      subjects: monthSubjects,
      topSubjects: monthSubjects.slice(0, 5),
      heatmap: [...heatMap.entries()].map(([d, minutes]) => ({ date: d, minutes })),
      sessionCount: monthSessions.length,
    };

    return { daily, monthly };
  });

function rollupSubjects(sessions: StudySession[]): SubjectTotal[] {
  const map = new Map<string, SubjectTotal>();
  for (const s of sessions) {
    const cur = map.get(s.subject) ?? { subject: s.subject, minutes: 0, sessions: 0 };
    cur.minutes += s.durationMinutes;
    cur.sessions += 1;
    map.set(s.subject, cur);
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}

export const setGoal = createServerFn({ method: "POST" })
  .validator((data: { hours: number }) => ({
    hours: Math.min(400, Math.max(1, Number(data.hours) || 40)),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId);
    await sql`
      update study_profiles
      set goal_hours = ${data.hours}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return { goalHours: data.hours };
  });

export const setTheme = createServerFn({ method: "POST" })
  .validator((data: { theme: ThemeMode }) => ({
    theme: data.theme === "light" ? ("light" as const) : ("dark" as const),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(context.userId);
    await sql`
      update study_profiles
      set theme = ${data.theme}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return { theme: data.theme };
  });

export const getAchievements = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureProfile(context.userId);
    const rows = await sql<AchievementRow>`
      select badge_id, name, unlocked_at
      from study_achievements
      where user_id = ${context.userId}
      order by unlocked_at desc
    `;
    return {
      unlocked: rows.map(mapAchievement),
      catalog: Object.values(BADGE_MAP),
    };
  });

export const syncCalendar = createServerFn({ method: "POST" })
  .validator((data: CreateSessionInput & { sessionId?: number }) => ({
    ...validateSession(data),
    sessionId: data.sessionId,
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<CalendarSyncResult> => {
    const addUrl = googleCalendarTemplateUrl(data);
    const { callTool } = await import("@/lib/app-data/client.server");
    const startIso = `${data.date}T${data.startTime}:00`;
    const endDate =
      parseHHMM(data.endTime) <= parseHHMM(data.startTime)
        ? addDays(data.date, 1)
        : data.date;
    const endIso = `${endDate}T${data.endTime}:00`;

    const result = await callTool(
      GoogleCalendarTools.search,
      {
        query: "Study",
        timeMin: `${data.date}T00:00:00`,
        timeMax: `${data.date}T23:59:59`,
      },
      { connectorType: ConnectorType.GoogleCalendar },
    );

    if (!result.ok) {
      const classified = classifyCallToolError(result);
      return {
        ok: false,
        pending: result.pending,
        loginRequired: result.loginRequired,
        loginUrl: result.loginUrl,
        addUrl,
        events: [],
        conflict: false,
        message: classified?.message ?? "Calendar sync is optional. Add the block with the Google Calendar link.",
      };
    }

    const events = normalizeCalendarEvents(result.data);
    const startMin = parseHHMM(data.startTime);
    const endMin = parseHHMM(data.endTime) + (endDate !== data.date ? 24 * 60 : 0);
    const conflict = events.some((event) => {
      const s = extractMinutes(event.start);
      const e = extractMinutes(event.end);
      return s < endMin && e > startMin;
    });

    if (data.sessionId) {
      const sql = await getSql();
      await sql`
        update study_sessions
        set calendar_synced = true
        where id = ${data.sessionId} and user_id = ${context.userId}
      `;
    }

    const avail = await callTool(
      GoogleCalendarTools.availability,
      { start: startIso, end: endIso },
      { connectorType: ConnectorType.GoogleCalendar },
    );
    const busy = !avail.ok ? conflict : Boolean(readBusy(avail.data)) || conflict;

    return {
      ok: true,
      addUrl,
      events,
      conflict: busy,
      message: busy
        ? "That slot looks busy on Google Calendar. You can still add the study block."
        : "Calendar is free. Add this study block with one click.",
    };
  });

function readBusy(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  if (rec.busy === true) return true;
  if (Array.isArray(rec.busy) && rec.busy.length > 0) return true;
  return false;
}

function extractMinutes(iso: string): number {
  const time = iso.slice(11, 16);
  if (/^\d{2}:\d{2}$/.test(time)) return parseHHMM(time);
  return 0;
}

function normalizeCalendarEvents(data: unknown): CalendarEvent[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { events?: unknown }).events)
      ? ((data as { events: unknown[] }).events)
      : data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
        ? ((data as { items: unknown[] }).items)
        : [];
  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const title =
        (typeof rec.summary === "string" && rec.summary) ||
        (typeof rec.title === "string" && rec.title) ||
        "Event";
      const start =
        readEventTime(rec.start) ||
        (typeof rec.start === "string" ? rec.start : "");
      const end =
        readEventTime(rec.end) || (typeof rec.end === "string" ? rec.end : "");
      if (!start) return null;
      return { title, start, end };
    })
    .filter((v): v is CalendarEvent => v !== null)
    .slice(0, 12);
}

function readEventTime(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.dateTime === "string") return rec.dateTime;
    if (typeof rec.date === "string") return rec.date;
  }
  return "";
}
