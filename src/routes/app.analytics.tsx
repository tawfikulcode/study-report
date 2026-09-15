import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MonthlyLine, SubjectPie, WeeklyBar } from "@/components/analytics-charts";
import { GoalCard } from "@/components/gamification";
import { Heatmap } from "@/components/heatmap";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { setGoal } from "@/lib/study/server";
import { useAnalytics } from "@/lib/study/hooks";
import { formatHours } from "@/lib/study/format";

export const Route = createFileRoute("/app/analytics")({ component: Analytics });

function Analytics() {
  const { data, isPending, refetch } = useAnalytics();
  const [hours, setHours] = useState("");

  if (isPending || !data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted">
          {formatHours(data.totalMinutes)}h lifetime · intensity is hours per day.
        </p>
      </div>
      <GoalCard goalHours={data.goalHours} monthMinutes={data.monthMinutes} />
      <Card>
        <CardHeader>
          <CardTitle>Set monthly target</CardTitle>
          <CardDescription>Hours you want to complete this month.</CardDescription>
        </CardHeader>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const value = Number(hours);
            if (!value) return;
            await setGoal({ data: { hours: value } });
            toast.success("Goal updated");
            setHours("");
            void refetch();
          }}
        >
          <Input
            type="number"
            min={1}
            max={400}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder={`${data.goalHours}`}
            className="max-w-32"
          />
          <Button type="submit">Save goal</Button>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Heatmap</CardTitle>
          <CardDescription>GitHub-style intensity by hours studied.</CardDescription>
        </CardHeader>
        <Heatmap data={data.heatmap} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <CardDescription>Hours per day</CardDescription>
          </CardHeader>
          <WeeklyBar data={data.weekly} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This month</CardTitle>
            <CardDescription>Daily hours</CardDescription>
          </CardHeader>
          <MonthlyLine data={data.monthly} />
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>Share of lifetime hours</CardDescription>
        </CardHeader>
        <SubjectPie data={data.subjects} />
      </Card>
    </div>
  );
}
