import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatHours, startOfWeek, todayISO } from "@/lib/study/format";
import type { DayHours, SubjectTotal } from "@/lib/study/types";

const COLORS = ["#00f5ff", "#22d3ee", "#67e8f9", "#5eead4", "#94a3b8", "#64748b"];

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--fg)",
  fontSize: 12,
};

export function WeeklyBar({ data }: { data: DayHours[] }) {
  const start = startOfWeek();
  const series = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = todayISO(d);
    const minutes = data.find((x) => x.date === iso)?.minutes ?? 0;
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      hours: Number((minutes / 60).toFixed(2)),
    };
  });
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="hours" fill="var(--accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyLine({ data }: { data: DayHours[] }) {
  const now = new Date();
  const days = now.getDate();
  const series = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const minutes = data.find((x) => x.date === iso)?.minutes ?? 0;
    return { label: String(d), hours: Number((minutes / 60).toFixed(2)) };
  });
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectPie({
  data,
  id = "subject-pie",
}: {
  data: SubjectTotal[];
  id?: string;
}) {
  const series = data.slice(0, 6).map((s) => ({
    name: s.subject,
    value: Number((s.minutes / 60).toFixed(2)),
  }));
  if (series.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No subject data yet.</p>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%" id={id}>
        <PieChart>
          <Pie data={series} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
            {series.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value}h`, "Hours"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] text-muted">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1">
            <span
              className="size-2 rounded-full"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {s.name} {formatHours(s.value * 60)}h
          </span>
        ))}
      </div>
    </div>
  );
}
