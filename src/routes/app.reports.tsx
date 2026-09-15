import { createFileRoute } from "@tanstack/react-router";
import { DailyReportCard, MonthlyReportCard } from "@/components/report-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useReports } from "@/lib/study/hooks";

export const Route = createFileRoute("/app/reports")({ component: Reports });

function Reports() {
  const { data, isPending } = useReports();
  const user = useCurrentUser();
  const identity = {
    name: user?.displayName ?? user?.primaryEmail ?? "Student",
    avatar: user?.profileImageUrl,
  };

  if (isPending || !data) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="grid gap-10">
      <div>
        <h1 className="font-display text-2xl font-semibold">Report cards</h1>
        <p className="text-sm text-muted">
          Styled cards ready to share. Download as PNG — no PDF upload.
        </p>
      </div>
      <DailyReportCard report={data.daily} identity={identity} />
      <MonthlyReportCard report={data.monthly} identity={identity} />
    </div>
  );
}
