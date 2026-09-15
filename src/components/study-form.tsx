import { useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { redirectToLoginIfRequired } from "@/lib/app-data/login";
import { createSession, syncCalendar } from "@/lib/study/server";
import {
  googleCalendarTemplateUrl,
  minutesBetween,
  todayISO,
} from "@/lib/study/format";
import { savePendingSession } from "@/lib/study/offline";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateSessionInput, StudySession } from "@/lib/study/types";

const SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English", "History", "CS", "Language"];

function nowTime(offsetMin = 0): string {
  const d = new Date(Date.now() + offsetMin * 60_000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StudyForm({
  onSaved,
}: {
  onSaved?: (session: StudySession) => void;
}) {
  const [subject, setSubject] = useState("Math");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState(nowTime(-90));
  const [endTime, setEndTime] = useState(nowTime());
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const duration = minutesBetween(startTime, endTime);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload: CreateSessionInput = {
      subject,
      topic,
      date,
      startTime,
      endTime,
      rating,
      notes,
      source: "form",
    };
    setSaving(true);
    try {
      if (!navigator.onLine) {
        await savePendingSession(payload);
        toast.message("Saved offline. It will sync when you are back online.");
        setTopic("");
        setNotes("");
        return;
      }
      const result = await createSession({ data: payload });
      toast.success(`Logged ${result.session?.subject ?? subject} · +${result.xpGain} XP`);
      for (const badge of result.newBadges) {
        toast.success(`Badge unlocked: ${badge.name}`);
      }
      if (result.session) onSaved?.(result.session);
      void attemptCalendar(payload, result.session?.id);
      setTopic("");
      setNotes("");
    } catch (err) {
      if (!navigator.onLine) {
        await savePendingSession(payload);
        toast.message("Saved offline.");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not save session");
      }
    } finally {
      setSaving(false);
    }
  }

  async function attemptCalendar(payload: CreateSessionInput, sessionId?: number) {
    try {
      const res = await syncCalendar({ data: { ...payload, sessionId } });
      if (res.loginRequired && res.loginUrl) {
        redirectToLoginIfRequired({
          ok: false,
          data: null,
          loginRequired: true,
          loginUrl: res.loginUrl,
        });
        return;
      }
      toast.message(res.message, {
        action: {
          label: "Add to Calendar",
          onClick: () => window.open(res.addUrl, "_blank", "noopener"),
        },
      });
    } catch {
      window.open(googleCalendarTemplateUrl(payload), "_blank", "noopener");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a session</CardTitle>
        <CardDescription>
          Duration is calculated on save · {Math.floor(duration / 60)}h {duration % 60}m
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              list="subjects"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <datalist id="subjects">
              {SUBJECTS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Calculus · limits"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="start">Start</Label>
            <Input
              id="start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="end">End</Label>
            <Input
              id="end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Focus rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`h-11 flex-1 rounded-md border text-sm tabular-nums ${
                  rating === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-2"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What clicked, what to revisit"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Save session
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.open(
                googleCalendarTemplateUrl({ subject, topic, date, startTime, endTime, notes }),
                "_blank",
                "noopener",
              )
            }
          >
            <CalendarPlus />
            Calendar
          </Button>
        </div>
      </form>
    </Card>
  );
}
