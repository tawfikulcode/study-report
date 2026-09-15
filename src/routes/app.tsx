import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useDashboard, useOfflineSync } from "@/lib/study/hooks";
import { registerStudyWorker } from "@/lib/study/sw-register";
import { useEffect } from "react";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const dash = useDashboard();
  useOfflineSync();
  useEffect(() => {
    registerStudyWorker();
  }, []);
  return (
    <AppShell
      streak={dash.data?.profile.streak}
      level={dash.data?.profile.level}
    />
  );
}
