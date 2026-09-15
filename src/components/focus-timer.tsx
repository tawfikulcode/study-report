import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { createSession } from "@/lib/study/server";
import { savePendingSession } from "@/lib/study/offline";
import { pad2, todayISO } from "@/lib/study/format";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WORK = 25 * 60;
const BREAK = 5 * 60;

function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02 + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7 + i * 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + 0.9 + i * 0.1);
    });
    void ctx.resume();
  } catch {
    /* audio blocked */
  }
}

function toHHMM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function FocusTimer({ onSaved }: { onSaved?: () => void }) {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [remaining, setRemaining] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("Deep work");
  const startedAt = useRef<Date | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining > 0) return;
    playChime();
    setRunning(false);
    if (mode === "work") {
      void saveWorkBlock();
      setMode("break");
      setRemaining(BREAK);
    } else {
      setMode("work");
      setRemaining(WORK);
      toast.message("Break complete. Ready for another block?");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  async function saveWorkBlock() {
    const end = new Date();
    const start = startedAt.current ?? new Date(end.getTime() - WORK * 1000);
    const payload = {
      subject: subject.trim() || "Focus",
      topic: topic.trim() || "Pomodoro",
      date: todayISO(),
      startTime: toHHMM(start),
      endTime: toHHMM(end),
      rating: 5,
      notes: "Auto-saved from focus timer",
      source: "timer" as const,
    };
    try {
      if (!navigator.onLine) {
        await savePendingSession(payload);
        toast.message("Timer saved offline.");
        return;
      }
      const result = await createSession({ data: payload });
      toast.success(`Focus block saved · +${result.xpGain} XP`);
      onSaved?.();
    } catch {
      await savePendingSession(payload);
      toast.message("Timer saved offline.");
    }
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const total = mode === "work" ? WORK : BREAK;
  const pct = ((total - remaining) / total) * 100;
  const label = useMemo(() => (mode === "work" ? "Focus" : "Break"), [mode]);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Focus timer</CardTitle>
        <CardDescription>25 minutes of work, 5 minutes of rest. Completing a focus block saves a session.</CardDescription>
      </CardHeader>
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col items-center justify-center gap-6 py-4">
          <div className="relative grid size-56 place-items-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-surface-2" strokeWidth="6" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${((100 - pct) / 100) * 2 * Math.PI * 52}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-muted uppercase">{label}</p>
              <p className="font-display text-5xl font-semibold tabular-nums">
                {pad2(mm)}:{pad2(ss)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!running && mode === "work" && !startedAt.current) {
                  startedAt.current = new Date();
                }
                setRunning((v) => !v);
              }}
            >
              {running ? <Pause /> : <Play />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRunning(false);
                setMode("work");
                setRemaining(WORK);
                startedAt.current = null;
              }}
            >
              <RotateCcw />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid gap-3 self-center">
          <div className="grid gap-1.5">
            <Label htmlFor="timer-subject">Subject</Label>
            <Input
              id="timer-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="timer-topic">Topic</Label>
            <Input
              id="timer-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
