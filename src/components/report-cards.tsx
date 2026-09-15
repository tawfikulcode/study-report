import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import {
  formatDuration,
  formatHours,
  formatLongDate,
  formatMonthYear,
  formatTimeSlot,
} from "@/lib/study/format";
import type { DailyReport, MonthlyReport } from "@/lib/study/types";
import { Button } from "@/components/ui/button";
import { MonthHeatmap } from "@/components/heatmap";
import { SubjectPie } from "@/components/analytics-charts";

const CARD_BG = "#05070b";
const CARD_FG = "#e8f4f7";
const CARD_MUTED = "#8ba3ad";
const CARD_LINE = "rgba(0,245,255,0.16)";
const CARD_ACCENT = "#00f5ff";

type Identity = {
  name: string;
  avatar?: string | null;
};

async function downloadPng(node: HTMLElement, filename: string) {
  const canvas = await html2canvas(node, {
    backgroundColor: CARD_BG,
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export function DailyReportCard({
  report,
  identity,
}: {
  report: DailyReport;
  identity: Identity;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Daily report</h2>
        <Button
          size="sm"
          onClick={async () => {
            if (!ref.current) return;
            setBusy(true);
            try {
              await downloadPng(ref.current, `study-daily-${report.date}.png`);
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          <Download />
          Download as PNG
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div
          ref={ref}
          className="w-[900px] rounded-[28px] p-8"
          style={{
            background: CARD_BG,
            color: CARD_FG,
            fontFamily: "Outfit, sans-serif",
            border: `1px solid ${CARD_LINE}`,
          }}
        >
          <header className="flex items-center justify-between border-b pb-6" style={{ borderColor: CARD_LINE }}>
            <div className="flex items-center gap-4">
              <AvatarMark name={identity.name} src={identity.avatar} />
              <div>
                <p style={{ color: CARD_ACCENT, fontSize: 11, letterSpacing: "0.18em" }}>
                  DAILY REPORT
                </p>
                <h3 className="font-display text-2xl font-semibold">{identity.name}</h3>
                <p style={{ color: CARD_MUTED }}>{formatLongDate(report.date)}</p>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <Stat label="Hours today" value={formatDuration(report.totalMinutes)} />
              <Stat label="Streak" value={`${report.streak} days`} />
              <Stat label="Level" value={`Lv ${report.level}`} />
            </div>
          </header>

          <table className="mt-6 w-full text-left text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: CARD_MUTED }}>
                {["Subject", "Topic", "Time slot", "Duration"].map((h) => (
                  <th key={h} className="pb-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8" style={{ color: CARD_MUTED }}>
                    No sessions logged today.
                  </td>
                </tr>
              ) : (
                report.sessions.map((s) => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${CARD_LINE}` }}>
                    <td className="py-3">{s.subject}</td>
                    <td className="py-3">{s.topic}</td>
                    <td className="py-3 tabular-nums">{formatTimeSlot(s.startTime, s.endTime)}</td>
                    <td className="py-3 tabular-nums">{formatDuration(s.durationMinutes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <footer
            className="mt-8 flex items-end justify-between border-t pt-5"
            style={{ borderColor: CARD_LINE }}
          >
            <p style={{ color: CARD_MUTED, fontSize: 13 }}>
              {report.subjects.length} subject{report.subjects.length === 1 ? "" : "s"}
            </p>
            <p className="max-w-md text-right text-sm" style={{ color: CARD_FG }}>
              {report.quote}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function MonthlyReportCard({
  report,
  identity,
}: {
  report: MonthlyReport;
  identity: Identity;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Monthly report</h2>
        <Button
          size="sm"
          onClick={async () => {
            if (!ref.current) return;
            setBusy(true);
            try {
              await downloadPng(
                ref.current,
                `study-monthly-${report.year}-${report.month}.png`,
              );
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          <Download />
          Download as PNG
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div
          ref={ref}
          className="w-[900px] rounded-[28px] p-8"
          style={{
            background: CARD_BG,
            color: CARD_FG,
            fontFamily: "Outfit, sans-serif",
            border: `1px solid ${CARD_LINE}`,
          }}
        >
          <header className="flex items-center justify-between border-b pb-6" style={{ borderColor: CARD_LINE }}>
            <div>
              <p style={{ color: CARD_ACCENT, fontSize: 11, letterSpacing: "0.18em" }}>
                MONTHLY REPORT
              </p>
              <h3 className="font-display text-2xl font-semibold">{identity.name}</h3>
              <p style={{ color: CARD_MUTED }}>{formatMonthYear(report.month, report.year)}</p>
            </div>
            <div className="flex gap-5 text-right">
              <Stat label="Total hours" value={formatDuration(report.totalMinutes)} />
              <Stat label="Avg / day" value={`${formatHours(report.avgPerDay)}h`} />
              <Stat label="Goal" value={`${Math.round(report.goalPct)}%`} />
              <Stat label="Best streak" value={`${report.maxStreak}`} />
            </div>
          </header>

          <div className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-3 text-xs" style={{ color: CARD_MUTED }}>
                Subject hours
              </p>
              <SubjectPie data={report.subjects} />
            </div>
            <div>
              <p className="mb-3 text-xs" style={{ color: CARD_MUTED }}>
                Month heatmap
              </p>
              <MonthHeatmap
                year={report.year}
                month={Number(report.month)}
                data={report.heatmap}
              />
            </div>
          </div>

          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr style={{ color: CARD_MUTED }}>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Total hours</th>
                <th className="pb-3 font-medium">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {report.topSubjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6" style={{ color: CARD_MUTED }}>
                    No sessions this month.
                  </td>
                </tr>
              ) : (
                report.topSubjects.map((s) => (
                  <tr key={s.subject} style={{ borderTop: `1px solid ${CARD_LINE}` }}>
                    <td className="py-3">{s.subject}</td>
                    <td className="py-3 tabular-nums">{formatDuration(s.minutes)}</td>
                    <td className="py-3 tabular-nums">{s.sessions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <footer className="mt-8 border-t pt-5 text-xs" style={{ borderColor: CARD_LINE, color: CARD_MUTED }}>
            Generated by StudyReport AI
          </footer>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] tracking-wide uppercase" style={{ color: CARD_MUTED }}>
        {label}
      </p>
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function AvatarMark({ name, src }: { name: string; src?: string | null }) {
  const letter = name.trim().charAt(0).toUpperCase() || "S";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={56}
        height={56}
        crossOrigin="anonymous"
        className="size-14 rounded-full object-cover"
        style={{ border: `1px solid ${CARD_LINE}` }}
      />
    );
  }
  return (
    <div
      className="grid size-14 place-items-center rounded-full font-display text-xl font-semibold"
      style={{ background: "#121a22", color: CARD_ACCENT, border: `1px solid ${CARD_LINE}` }}
    >
      {letter}
    </div>
  );
}
