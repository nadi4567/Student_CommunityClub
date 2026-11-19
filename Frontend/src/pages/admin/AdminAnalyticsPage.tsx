import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminCharts } from "@/components/AdminCharts";
import { Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

function parseActivityDate(value?: string) {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]) - 1, day: Number(iso[3]) };
  }
  const withDay = value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (withDay) {
    const date = new Date(`${withDay[1]} ${withDay[2]}, ${withDay[3]}`);
    if (Number.isNaN(date.getTime())) return null;
    return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
  }
  const monthYear = value.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const date = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (Number.isNaN(date.getTime())) return null;
    return { year: date.getFullYear(), month: date.getMonth(), day: null };
  }
  return null;
}

function inMonth(value: string | undefined, year: number, month: number) {
  const date = parseActivityDate(value);
  return Boolean(date && date.year === year && date.month === month);
}

function inDay(value: string | undefined, year: number, month: number, day: number) {
  const date = parseActivityDate(value);
  return Boolean(date && date.day === day && date.year === year && date.month === month);
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function mondayOffset(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export function AdminAnalyticsPage() {
  const store = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthStats = useMemo(() => {
    const users = store.users.filter((u) => inMonth(u.createdAt ?? u.memberSince, year, month)).length;
    const clubs = store.clubs.filter((c) => inMonth(c.createdAt ?? c.founded, year, month)).length;
    const monthEvents = store.events.filter((e) => inMonth(e.date, year, month));
    const events = monthEvents.length;
    const registrations = monthEvents.reduce((sum, e) => sum + e.registeredIds.length, 0);
    const reports = store.reports.filter((r) => inMonth(r.createdAt, year, month)).length;
    const leaderRequests = store.leaderRequests.filter((r) => inMonth(r.createdAt, year, month)).length;
    return { users, clubs, events, registrations, reports, leaderRequests, monthEvents };
  }, [store.users, store.clubs, store.events, store.reports, store.leaderRequests, year, month]);

  const yearMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) => {
        const users = store.users.filter((u) => inMonth(u.createdAt ?? u.memberSince, year, m)).length;
        const events = store.events.filter((e) => inMonth(e.date, year, m)).length;
        const clubs = store.clubs.filter((c) => inMonth(c.createdAt ?? c.founded, year, m)).length;
        return { month: m, users, events, clubs };
      }),
    [store.users, store.events, store.clubs, year],
  );

  const dayCount = new Date(year, month + 1, 0).getDate();
  const offset = mondayOffset(year, month);
  const cells = Array.from({ length: offset + dayCount }, (_, i) => (i < offset ? null : i - offset + 1));
  const activityByDay = useMemo(() => {
    const map = new Map<number, number>();
    const bump = (value?: string) => {
      const date = parseActivityDate(value);
      if (!date || date.day == null || date.year !== year || date.month !== month) return;
      map.set(date.day, (map.get(date.day) ?? 0) + 1);
    };
    store.users.forEach((u) => bump(u.createdAt ?? u.memberSince));
    store.clubs.forEach((c) => bump(c.createdAt ?? c.founded));
    store.events.forEach((e) => bump(e.date));
    store.reports.forEach((r) => bump(r.createdAt));
    store.leaderRequests.forEach((r) => bump(r.createdAt));
    return map;
  }, [store.users, store.clubs, store.events, store.reports, store.leaderRequests, year, month]);

  const dayStats =
    selectedDay == null
      ? null
      : {
          users: store.users.filter((u) => inDay(u.createdAt ?? u.memberSince, year, month, selectedDay)).length,
          events: store.events.filter((e) => inDay(e.date, year, month, selectedDay)).length,
          clubs: store.clubs.filter((c) => inDay(c.createdAt ?? c.founded, year, month, selectedDay)).length,
          registrations: store.events
            .filter((e) => inDay(e.date, year, month, selectedDay))
            .reduce((sum, e) => sum + e.registeredIds.length, 0),
          reports: store.reports.filter((r) => inDay(r.createdAt, year, month, selectedDay)).length,
          leaderRequests: store.leaderRequests.filter((r) => inDay(r.createdAt, year, month, selectedDay)).length,
        };

  const shownStats = dayStats ?? monthStats;
  const monthLabel = new Date(year, month, 1).toLocaleString("en-US", { month: "short" });
  const rangeLabel = selectedDay ? `${selectedDay} ${monthLabel} ${year}` : `${monthLabel} ${year}`;

  const periodUsers = useMemo(
    () =>
      store.users.filter((u) =>
        selectedDay != null
          ? inDay(u.createdAt ?? u.memberSince, year, month, selectedDay)
          : inMonth(u.createdAt ?? u.memberSince, year, month),
      ),
    [store.users, selectedDay, year, month],
  );
  const periodEvents = useMemo(
    () =>
      store.events.filter((e) =>
        selectedDay != null ? inDay(e.date, year, month, selectedDay) : inMonth(e.date, year, month),
      ),
    [store.events, selectedDay, year, month],
  );

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDay(null);
  }

  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="Platform analytics and counts." />;
  }

  const totals = {
    students: store.users.filter((u) => u.role === "student").length,
    leaders: store.users.filter((u) => u.role === "leader").length,
    admins: store.users.filter((u) => u.role === "admin").length,
    clubs: store.clubs.length,
    events: store.events.length,
    pendingLeaderRequests: store.leaderRequests.filter((r) => r.status === "pending").length,
    openReports: store.reports.filter((r) => r.status === "open").length,
  };

  const cards = [
    { label: "Students", value: totals.students },
    { label: "Leaders", value: totals.leaders },
    { label: "Admins", value: totals.admins },
    { label: "Clubs", value: totals.clubs },
    { label: "Events", value: totals.events },
    { label: "Pending leader applications", value: totals.pendingLeaderRequests },
    { label: "Open reports", value: totals.openReports },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Platform totals and monthly activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">{selectedDay ? `Activity on ${rangeLabel}` : "Monthly activity"}</h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" className="h-10 w-10 rounded-2xl px-0" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="month"
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none focus:border-brand"
              value={`${year}-${String(month + 1).padStart(2, "0")}`}
              onChange={(e) => {
                const [nextYear, nextMonth] = e.target.value.split("-").map(Number);
                if (!nextYear || !nextMonth) return;
                setYear(nextYear);
                setMonth(nextMonth - 1);
                setSelectedDay(null);
              }}
            />
            <Button type="button" variant="secondary" className="h-10 w-10 rounded-2xl px-0" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="max-w-[280px]">
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-slate-400">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-8" />;
                const count = activityByDay.get(day) ?? 0;
                const active = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay((current) => (current === day ? null : day))}
                    className={`relative h-8 rounded-lg text-xs ${
                      active ? "bg-brand font-semibold text-white" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                    {count > 0 ? (
                      <span
                        className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                          active ? "bg-white" : "bg-brand"
                        }`}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {selectedDay
                ? `${rangeLabel}: ${shownStats.users} users, ${shownStats.events} events, ${shownStats.clubs} clubs`
                : "Select a day to see that day's counts."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MonthStat label="Users joined" value={shownStats.users} />
            <MonthStat label="Events" value={shownStats.events} />
            <MonthStat label="Clubs founded" value={shownStats.clubs} />
            <MonthStat label="Registrations" value={shownStats.registrations} />
            <MonthStat label="Reports" value={shownStats.reports} />
            <MonthStat label="Leader apps" value={shownStats.leaderRequests} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-slate-900">{year} by month</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {yearMonths.map((row) => {
            const label = new Date(year, row.month, 1).toLocaleString("en-US", { month: "short" });
            const active = row.month === month;
            return (
              <button
                key={row.month}
                type="button"
                onClick={() => {
                  setMonth(row.month);
                  setSelectedDay(null);
                }}
                className={`rounded-2xl border px-3 py-3 text-left ${
                  active ? "border-brand bg-violet-50" : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.users} users · {row.events} events · {row.clubs} clubs
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      <AdminCharts clubs={store.clubs} users={periodUsers} events={periodEvents} rangeLabel={rangeLabel} />
    </div>
  );
}

function MonthStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
