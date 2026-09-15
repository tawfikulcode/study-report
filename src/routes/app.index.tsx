import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { AchievementGrid, GoalCard, XpCard } from "@/components/gamification";
import { SessionList } from "@/components/session-list";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatHours } from "@/lib/study/format";
import { useDashboard } from "@/lib/study/hooks";

export const Route = createFileRoute("/app/")({ component: Overview });

function Overview() {
  const { data, isPending, error } = useDashboard();

  if (isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-muted">Could not load your workspace.</p>;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted">Your streak, XP, and latest blocks.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-primary" />
              Streak
            </CardTitle>
            <CardDescription>Consecutive study days</CardDescription>
          </CardHeader>
          <p className="font-display text-4xl font-semibold tabular-nums">
            {data.profile.streak}
          </p>
          <p className="mt-1 text-xs text-muted">Best {data.profile.maxStreak}</p>
        </Card>
        <XpCard profile={data.profile} todayMinutes={data.todayMinutes} />
        <GoalCard goalHours={data.profile.goalHours} monthMinutes={data.monthMinutes} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Today" value={formatDuration(data.todayMinutes)} />
        <MiniStat label="This week" value={formatDuration(data.weekMinutes)} />
        <MiniStat label="This month" value={`${formatHours(data.monthMinutes)}h`} />
      </div>
      <AchievementGrid unlocked={data.achievements} />
      <SessionList sessions={data.recent} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
