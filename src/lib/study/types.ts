export type ThemeMode = "dark" | "light";

export type SessionSource = "form" | "timer" | "offline";

export type StudySession = {
  id: number;
  subject: string;
  topic: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  rating: number | null;
  notes: string;
  source: SessionSource;
  calendarSynced: boolean;
  createdAt: string;
};

export type StudyProfile = {
  userId: string;
  totalXp: number;
  level: number;
  streak: number;
  maxStreak: number;
  lastStudyDate: string | null;
  theme: ThemeMode;
  goalHours: number;
};

export type Achievement = {
  badgeId: string;
  name: string;
  unlockedAt: string;
};

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
};

export type DayHours = {
  date: string;
  minutes: number;
};

export type SubjectTotal = {
  subject: string;
  minutes: number;
  sessions: number;
};

export type AnalyticsPayload = {
  heatmap: DayHours[];
  weekly: DayHours[];
  monthly: DayHours[];
  subjects: SubjectTotal[];
  goalHours: number;
  monthMinutes: number;
  totalMinutes: number;
  avgPerDay: number;
  streak: number;
  maxStreak: number;
  level: number;
  totalXp: number;
};

export type DailyReport = {
  date: string;
  totalMinutes: number;
  streak: number;
  level: number;
  sessions: StudySession[];
  subjects: SubjectTotal[];
  quote: string;
};

export type MonthlyReport = {
  month: string;
  year: number;
  totalMinutes: number;
  avgPerDay: number;
  goalHours: number;
  goalPct: number;
  maxStreak: number;
  subjects: SubjectTotal[];
  topSubjects: SubjectTotal[];
  heatmap: DayHours[];
  sessionCount: number;
};

export type DashboardPayload = {
  profile: StudyProfile;
  todayMinutes: number;
  weekMinutes: number;
  recent: StudySession[];
  achievements: Achievement[];
  newBadges: Achievement[];
  monthMinutes: number;
  pendingOffline: number;
};

export type CalendarEvent = {
  title: string;
  start: string;
  end: string;
};

export type CalendarSyncResult = {
  ok: boolean;
  pending?: boolean;
  loginRequired?: boolean;
  loginUrl?: string;
  addUrl: string;
  events: CalendarEvent[];
  conflict: boolean;
  message: string;
};

export type CreateSessionInput = {
  subject: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  rating?: number | null;
  notes?: string;
  source?: SessionSource;
};
