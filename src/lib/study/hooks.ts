import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { hydrateThemeFromProfile } from "@/components/theme-provider";
import {
  getAchievements,
  getAnalytics,
  getDashboard,
  getReports,
  listSessions,
  createSession,
} from "./server";
import {
  listPendingSessions,
  pendingCount,
  removePendingSession,
} from "./offline";

function useAuthedFlag() {
  const { user, isPending } = useCurrentUserState();
  return Boolean(user) && !isPending;
}

export function useDashboard() {
  const enabled = useAuthedFlag();
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
    enabled,
  });
  useEffect(() => {
    if (query.data?.profile.theme) {
      hydrateThemeFromProfile(query.data.profile.theme);
    }
  }, [query.data?.profile.theme]);
  return query;
}

export function useAnalytics() {
  const enabled = useAuthedFlag();
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(),
    enabled,
  });
}

export function useReports() {
  const enabled = useAuthedFlag();
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => getReports({ data: { range: "daily" } }),
    enabled,
  });
}

export function useSessions() {
  const enabled = useAuthedFlag();
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => listSessions({ data: { limit: 80 } }),
    enabled,
  });
}

export function useAchievements() {
  const enabled = useAuthedFlag();
  return useQuery({
    queryKey: ["achievements"],
    queryFn: () => getAchievements(),
    enabled,
  });
}

export function useOfflineSync() {
  const client = useQueryClient();
  const enabled = useAuthedFlag();
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const flush = async () => {
      if (!navigator.onLine) return;
      const pending = await listPendingSessions();
      for (const row of pending) {
        try {
          await createSession({
            data: {
              subject: row.subject,
              topic: row.topic,
              date: row.date,
              startTime: row.startTime,
              endTime: row.endTime,
              rating: row.rating,
              notes: row.notes,
              source: "offline",
            },
          });
          await removePendingSession(row.clientId);
        } catch {
          break;
        }
      }
      if (active) void client.invalidateQueries();
    };
    void flush();
    window.addEventListener("online", flush);
    return () => {
      active = false;
      window.removeEventListener("online", flush);
    };
  }, [client, enabled]);
}

export function usePendingOffline() {
  return useQuery({
    queryKey: ["pending-offline"],
    queryFn: pendingCount,
  });
}
