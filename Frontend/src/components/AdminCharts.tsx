import { Card } from "@/components/ui";
import type { Club, ClubEvent, User } from "@/lib/types";

const memberColor = "#6d5efc";
const registrationColor = "#38bdf8";
const roleColors = {
  student: "#6d5efc",
  leader: "#34d399",
  admin: "#fb7185",
};

export function AdminCharts({
  clubs,
  users,
  events,
  rangeLabel,
}: {
  clubs: Club[];
  users: User[];
  events: ClubEvent[];
  rangeLabel?: string;
}) {
  const userIds = new Set(users.map((user) => user.id));
  const clubRows = [...clubs]
    .map((club) => ({
      label: club.name.replace(/\s+Club$/, ""),
      members: club.memberIds.filter((id) => userIds.has(id)).length,
      registrations: events
        .filter((event) => event.clubId === club.id)
        .reduce((sum, event) => sum + event.registeredIds.length, 0),
    }))
    .sort((a, b) => b.members - a.members || b.registrations - a.registrations);

  const roles = [
    { label: "Students", value: users.filter((user) => user.role === "student").length, color: roleColors.student },
    { label: "Leaders", value: users.filter((user) => user.role === "leader").length, color: roleColors.leader },
    { label: "Admins", value: users.filter((user) => user.role === "admin").length, color: roleColors.admin },
  ];
  const titleSuffix = rangeLabel ? ` · ${rangeLabel}` : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Members and registrations{titleSuffix}</h3>
          <div className="flex gap-4 text-xs text-slate-500">
            <Legend color={memberColor} label="Members" />
            <Legend color={registrationColor} label="Event registrations" />
          </div>
        </div>
        <GroupedBars rows={clubRows} />
      </Card>
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Users by role{titleSuffix}</h3>
        <RoleDonut slices={roles} />
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function GroupedBars({
  rows,
}: {
  rows: { label: string; members: number; registrations: number }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No clubs to chart yet.</p>;
  }
  if (rows.every((row) => row.members === 0 && row.registrations === 0)) {
    return <p className="text-sm text-slate-500">No members or registrations in this period.</p>;
  }

  const max = Math.max(1, ...rows.flatMap((row) => [row.members, row.registrations]));
  const width = 560;
  const height = 240;
  const pad = { top: 12, right: 8, bottom: 48, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const groupW = innerW / rows.length;
  const barW = Math.min(18, groupW * 0.28);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Members and event registrations by club">
      {[0, 0.5, 1].map((step) => {
        const y = pad.top + innerH * (1 - step);
        return (
          <g key={step}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
              {Math.round(max * step)}
            </text>
          </g>
        );
      })}
      {rows.map((row, index) => {
        const x = pad.left + groupW * index + groupW / 2;
        const memberH = (row.members / max) * innerH;
        const registrationH = (row.registrations / max) * innerH;
        return (
          <g key={row.label}>
            <rect x={x - barW - 2} y={pad.top + innerH - memberH} width={barW} height={memberH} rx="4" fill={memberColor}>
              <title>{`${row.label}: ${row.members} members`}</title>
            </rect>
            <rect x={x + 2} y={pad.top + innerH - registrationH} width={barW} height={registrationH} rx="4" fill={registrationColor}>
              <title>{`${row.label}: ${row.registrations} registrations`}</title>
            </rect>
            <text x={x} y={height - 18} textAnchor="middle" className="fill-slate-500 text-[10px]">
              {row.label.length > 12 ? `${row.label.slice(0, 11)}…` : row.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RoleDonut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 160 160" className="h-44 w-44" role="img" aria-label="Users split by role">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#eef2ff" strokeWidth="18" />
        {total > 0
          ? slices.map((slice) => {
              const length = (slice.value / total) * circumference;
              const dash = `${length} ${circumference - length}`;
              const element = (
                <circle
                  key={slice.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  transform="rotate(-90 80 80)"
                >
                  <title>{`${slice.label}: ${slice.value}`}</title>
                </circle>
              );
              offset += length;
              return element;
            })
          : null}
        <text x="80" y="76" textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-slate-400 text-[11px]">
          users
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-6">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="font-semibold text-slate-900">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
