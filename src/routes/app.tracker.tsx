import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { StudyForm } from "@/components/study-form";
import { SessionList } from "@/components/session-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/lib/study/hooks";

export const Route = createFileRoute("/app/tracker")({ component: Tracker });

function Tracker() {
  const sessions = useSessions();
  const client = useQueryClient();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Study tracker</h1>
        <p className="text-sm text-muted">
          Log a block. Duration, XP, streak, and calendar hooks run on save.
        </p>
      </div>
      <StudyForm
        onSaved={() => {
          void client.invalidateQueries();
        }}
      />
      {sessions.isPending ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : (
        <SessionList sessions={sessions.data ?? []} />
      )}
    </div>
  );
}
