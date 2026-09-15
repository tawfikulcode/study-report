import { Award, Clock, Flame, Moon, Sparkles } from "lucide-react";
import { BADGES } from "@/lib/study/achievements";
import { formatDuration, formatHours, xpIntoLevel } from "@/lib/study/format";
import type { Achievement, StudyProfile } from "@/lib/study/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ICONS = {
  first_session: Sparkles,
  streak_7: Flame,
  hours_50: Clock,
  night_owl: Moon,
  perfect_week: Award,
} as const;

export function XpCard({
  profile,
  todayMinutes,
}: {
  profile: StudyProfile;
  todayMinutes: number;
}) {
  const into = xpIntoLevel(profile.totalXp);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Level {profile.level}</CardTitle>
        <CardDescription>
          {profile.totalXp.toFixed(1)} XP total · {formatDuration(todayMinutes)} today
        </CardDescription>
      </CardHeader>
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs text-muted tabular-nums">{into.toFixed(1)} / 100 XP</p>
        <p className="text-xs text-muted">0.1 XP per minute</p>
      </div>
      <Progress value={into} className="mt-2" />
    </Card>
  );
}

export function GoalCard({
  goalHours,
  monthMinutes,
}: {
  goalHours: number;
  monthMinutes: number;
}) {
  const hours = monthMinutes / 60;
  const pct = goalHours > 0 ? Math.min(100, (hours / goalHours) * 100) : 0;
  const remaining = Math.max(0, goalHours - hours);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly goal</CardTitle>
        <CardDescription>
          {formatHours(monthMinutes)}h of {goalHours}h · {remaining.toFixed(1)}h remaining
        </CardDescription>
      </CardHeader>
      <Progress value={pct} />
      <p className="mt-2 text-sm tabular-nums text-primary">{Math.round(pct)}% complete</p>
    </Card>
  );
}

export function AchievementGrid({ unlocked }: { unlocked: Achievement[] }) {
  const have = new Set(unlocked.map((a) => a.badgeId));
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {BADGES.map((badge) => {
        const Icon = ICONS[badge.id as keyof typeof ICONS] ?? Award;
        const on = have.has(badge.id);
        return (
          <Card
            key={badge.id}
            className={cn("p-4", on ? "glow-ring" : "opacity-55")}
          >
            <Icon className={cn("mb-3 size-5", on ? "text-primary" : "text-muted")} />
            <p className="font-display text-sm font-semibold">{badge.name}</p>
            <p className="mt-1 text-xs text-muted">{badge.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
