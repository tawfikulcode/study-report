import { formatHours, todayISO } from "@/lib/study/format";
import type { DayHours } from "@/lib/study/types";
import { cn } from "@/lib/utils";

function intensity(minutes: number): string {
  if (minutes <= 0) return "bg-surface-2";
  if (minutes < 30) return "bg-primary/25";
  if (minutes < 90) return "bg-primary/50";
  if (minutes < 180) return "bg-primary/75";
  return "bg-primary";
}

function buildGrid(days: number): string[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - days + 1);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);
  const out: string[] = [];
  const cursor = new Date(start);
  const end = new Date(today);
  while (end.getDay() !== 6) end.setDate(end.getDate() + 1);
  while (cursor <= end) {
    out.push(todayISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function Heatmap({
  data,
  compact = false,
}: {
  data: DayHours[];
  compact?: boolean;
}) {
  const map = new Map(data.map((d) => [d.date, d.minutes]));
  const cells = buildGrid(compact ? 35 : 119);
  const weeks = Math.ceil(cells.length / 7);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
          gridAutoRows: compact ? "10px" : "12px",
        }}
      >
        {Array.from({ length: weeks }).map((_, week) => (
          <div key={week} className="grid grid-rows-7 gap-1">
            {Array.from({ length: 7 }).map((__, day) => {
              const iso = cells[week * 7 + day];
              if (!iso) return <div key={day} />;
              const minutes = map.get(iso) ?? 0;
              return (
                <div
                  key={iso}
                  title={`${iso}: ${formatHours(minutes)}h`}
                  className={cn(
                    "aspect-square rounded-[3px]",
                    intensity(minutes),
                    compact ? "size-2.5" : "min-h-[12px]",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
        Less
        <span className="size-2.5 rounded-[3px] bg-surface-2" />
        <span className="size-2.5 rounded-[3px] bg-primary/25" />
        <span className="size-2.5 rounded-[3px] bg-primary/50" />
        <span className="size-2.5 rounded-[3px] bg-primary/75" />
        <span className="size-2.5 rounded-[3px] bg-primary" />
        More
      </div>
    </div>
  );
}

export function MonthHeatmap({
  year,
  month,
  data,
}: {
  year: number;
  month: number;
  data: DayHours[];
}) {
  const map = new Map(data.map((d) => [d.date, d.minutes]));
  const first = new Date(year, month - 1, 1);
  const days = new Date(year, month, 0).getDate();
  const offset = first.getDay();
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }),
  ];

  return (
    <div className="grid grid-cols-7 gap-1">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <div key={`${d}-${i}`} className="text-center text-[10px] text-muted">
          {d}
        </div>
      ))}
      {cells.map((iso, i) =>
        iso ? (
          <div
            key={iso}
            className={cn("aspect-square rounded-[4px]", intensity(map.get(iso) ?? 0))}
            title={`${iso}: ${formatHours(map.get(iso) ?? 0)}h`}
          />
        ) : (
          <div key={`e-${i}`} />
        ),
      )}
    </div>
  );
}
