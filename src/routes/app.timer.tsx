import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FocusTimer } from "@/components/focus-timer";

export const Route = createFileRoute("/app/timer")({ component: TimerPage });

function TimerPage() {
  const client = useQueryClient();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Focus timer</h1>
        <p className="text-sm text-muted">
          Classic 25/5. A completed focus block is stored as a session.
        </p>
      </div>
      <FocusTimer onSaved={() => void client.invalidateQueries()} />
    </div>
  );
}
