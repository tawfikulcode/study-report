import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Flame,
  ImageDown,
  LayoutDashboard,
  Moon,
  Sun,
  Timer,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard },
  { to: "/app/tracker", label: "Tracker", icon: BookOpen },
  { to: "/app/timer", label: "Timer", icon: Timer },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/reports", label: "Reports", icon: ImageDown },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/app") return pathname === "/app" || pathname === "/app/";
  return pathname.startsWith(to);
}

export function AppShell({
  streak,
  level,
}: {
  streak?: number;
  level?: number;
}) {
  const { user, isPending } = useCurrentUserState();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (isPending) {
    return (
      <div className="mesh-bg min-h-dvh p-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="mesh-bg min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-7xl">
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-2 border-r border-border p-4 md:flex">
          <Link to="/" className="mb-4 flex items-center gap-2 px-2">
            <span className="grid size-8 place-items-center rounded-md border border-border bg-surface">
              <Timer className="size-4 text-primary" />
            </span>
            <span className="font-display text-sm font-semibold">StudyReport</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
            <div className="flex items-center gap-2">
              <Badge>
                <Flame className="size-3 text-primary" />
                <span className="tabular-nums">{streak ?? 0} streak</span>
              </Badge>
              <Badge>
                Lv <span className="tabular-nums">{level ?? 1}</span>
              </Badge>
              {!online ? (
                <Badge className="border-warn/40 text-warn">
                  <WifiOff className="size-3" />
                  Offline
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                className="grid size-11 place-items-center rounded-md border border-border"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <UserButton />
            </div>
          </header>
          <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[10px]",
                active ? "text-primary" : "text-muted",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
