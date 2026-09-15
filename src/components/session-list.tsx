import { formatDuration, formatTimeSlot } from "@/lib/study/format";
import type { StudySession } from "@/lib/study/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SessionList({ sessions }: { sessions: StudySession[] }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>No blocks yet. Log one or run the focus timer.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card className="p-0">
      <div className="px-5 pt-5">
        <CardTitle>Recent sessions</CardTitle>
        <CardDescription className="mt-1">Newest first</CardDescription>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-3 px-5 py-3">
            <div>
              <p className="text-sm font-medium">
                {s.subject}
                <span className="text-muted"> · {s.topic}</span>
              </p>
              <p className="text-xs text-muted">
                {s.sessionDate} · {formatTimeSlot(s.startTime, s.endTime)}
              </p>
            </div>
            <p className="text-sm tabular-nums text-primary">{formatDuration(s.durationMinutes)}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
