import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import {
  BarChart3,
  Flame,
  ImageDown,
  Moon,
  Sun,
  Timer,
} from "lucide-react";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { ParticleField } from "@/components/particles";
import { useTheme } from "@/components/theme-provider";

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, isPending } = useCurrentUserState();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-hero]", {
        y: 18,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });
      gsap.from("[data-card]", {
        y: 24,
        opacity: 0,
        duration: 0.55,
        delay: 0.35,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const google = GROK_PROVIDERS.find((p) => p.idp === "google");

  return (
    <div ref={rootRef} className="mesh-bg relative min-h-dvh overflow-hidden">
      <ParticleField />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-border bg-surface glow-ring">
              <Timer className="size-4 text-primary" />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">
              StudyReport AI
            </span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="grid size-11 place-items-center rounded-md border border-border bg-surface/70"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </header>

        <main className="flex flex-1 flex-col items-start justify-center gap-10 py-16 md:gap-14">
          <div className="max-w-2xl">
            <p
              data-hero
              className="mb-4 text-xs font-medium tracking-[0.22em] text-primary uppercase"
            >
              Track. Level. Report.
            </p>
            <h1
              data-hero
              className="font-display text-4xl leading-[1.05] font-semibold text-glow md:text-6xl"
            >
              Every hour counted.
              <br />
              Every streak earned.
            </h1>
            <p data-hero className="mt-5 max-w-xl text-base text-muted md:text-lg">
              A cinematic study OS: pomodoro focus, GitHub-style heatmaps, XP
              levels, and shareable daily + monthly report cards.
            </p>
            <div data-hero className="mt-8 flex min-h-12 flex-wrap items-center gap-3">
              {isPending ? (
                <div className="h-12 w-56 animate-pulse rounded-lg bg-surface-2" />
              ) : user ? (
                <Button asChild size="lg">
                  <Link to="/app">Enter workspace</Link>
                </Button>
              ) : (
                google ? (
                  <Button
                    size="lg"
                    onClick={() => signIn(google.providerId, { callbackURL: "/app" })}
                  >
                    Continue with Google
                  </Button>
                ) : null
              )}
            </div>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Timer,
                title: "Focus timer",
                body: "25/5 pomodoro with auto-saved sessions and a clean chime.",
              },
              {
                icon: Flame,
                title: "Streaks + XP",
                body: "0.1 XP per minute. Levels, badges, and a living streak.",
              },
              {
                icon: BarChart3,
                title: "Heatmaps",
                body: "Weekly bars, monthly lines, subject pie, goal remaining.",
              },
              {
                icon: ImageDown,
                title: "Report cards",
                body: "Export daily and monthly cards as PNG in one click.",
              },
            ].map((item) => (
              <article
                key={item.title}
                data-card
                className="glass-panel rounded-xl p-5"
              >
                <item.icon className="mb-4 size-5 text-primary" />
                <h2 className="font-display text-base font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
