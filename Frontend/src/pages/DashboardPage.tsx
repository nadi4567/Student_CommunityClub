import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, ClipboardList, Flag, Shield, Users, Building2 } from "lucide-react";
import { AdminCharts } from "@/components/AdminCharts";
import { ClubCard } from "@/components/ClubCard";
import { HeroArt } from "@/components/HeroArt";
import { Button, Card } from "@/components/ui";
import { firstName, formatDate, greeting } from "@/lib/format";
import type { AdminStats, LeaderDashboardStats } from "@/lib/types";
import { unreadCount, useStore } from "@/lib/store";

export function DashboardPage() {
  const store = useStore();
  const user = store.currentUser!;
  const myClubs = store.clubs.filter((c) => c.memberIds.includes(user.id));
  const registered = store.events.filter((e) => e.registeredIds.includes(user.id));
  const upcoming = [...store.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const myRequests = store.leaderRequests.filter((r) => r.userId === user.id);
  const unread = unreadCount(store.notifications, user.id);
  const featured = store.clubs.filter((c) => c.featured).slice(0, 3);
  const pendingLeaders = store.leaderRequests.filter((r) => r.status === "pending");
  const openReports = store.reports.filter((r) => r.status === "open");
  const [leaderStats, setLeaderStats] = useState<LeaderDashboardStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    void store.getLeaderRequests();
    void store.getLeaderClubs();
    if (user.role === "leader") {
      void store.getLeaderDashboard().then(setLeaderStats);
    }
    if (user.role === "admin") {
      void store.getAdminStats().then(setAdminStats);
    }
  }, [store, user.role]);

  const statCards =
    user.role === "admin"
      ? [
          { icon: Users, label: "Students", value: adminStats?.students ?? store.users.filter((u) => u.role === "student").length },
          { icon: Building2, label: "Clubs", value: adminStats?.clubs ?? store.clubs.length },
          { icon: CalendarDays, label: "Events", value: adminStats?.events ?? store.events.length },
          { icon: Flag, label: "Open reports", value: adminStats?.openReports ?? openReports.length },
        ]
      : user.role === "leader" && leaderStats
        ? [
            { icon: Users, label: "Members", value: leaderStats.totalMembers },
            { icon: ClipboardList, label: "Join requests", value: leaderStats.pendingRequests },
            { icon: CalendarDays, label: "Upcoming events", value: leaderStats.upcomingEvents },
            { icon: Bell, label: "Registrations", value: leaderStats.totalRegistrations },
          ]
        : [
            { icon: Users, label: "My Clubs", value: myClubs.length },
            { icon: CalendarDays, label: "My Events", value: registered.length },
            { icon: ClipboardList, label: "Leader requests", value: myRequests.length },
            { icon: Bell, label: "Notifications", value: unread },
          ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {firstName(user.name)}!
        </h1>
        <p className="text-sm text-slate-500">Welcome back to your community.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Stat key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>
      {user.role === "admin" ? (
        <section className="mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Shield className="h-5 w-5 text-brand" />
            Admin Dashboard
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-brand">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold">{adminStats?.pendingLeaderRequests ?? pendingLeaders.length}</p>
                  <p className="text-xs text-slate-500">Pending leader requests</p>
                </div>
              </div>
              <Link to="/app/admin/requests">
                <Button>Review requests</Button>
              </Link>
            </Card>
            <Card className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-brand">
                  <Flag className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xl font-bold">{adminStats?.openReports ?? openReports.length}</p>
                  <p className="text-xs text-slate-500">Open content reports</p>
                </div>
              </div>
              <Link to="/app/admin/reports">
                <Button variant="secondary">Monitor reports</Button>
              </Link>
            </Card>
          </div>
          <div className="mt-4">
            <AdminCharts clubs={store.clubs} users={store.users} events={store.events} />
          </div>
        </section>
      ) : null}
      {user.role === "leader" ? (
        <section className="mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-brand" />
            Leader Dashboard
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-slate-600">
                {leaderStats?.pendingRequests ?? 0} membership request
                {(leaderStats?.pendingRequests ?? 0) === 1 ? "" : "s"} waiting for review.
              </p>
              <Link to="/app/leader/members">
                <Button>Review requests</Button>
              </Link>
            </Card>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">My Clubs (Leader)</h3>
              <div className="space-y-3">
                {(store.leaderClubs ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No clubs yet.</p>
                ) : (
                  (store.leaderClubs ?? []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.category}</p>
                      </div>
                      <Link to="/app/leader/club">
                        <Button className="h-8 px-3 text-xs">Manage</Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">My Events</h3>
              <div className="space-y-3">
                {(store.leaderClubs ?? []).flatMap((c) =>
                  store.events
                    .filter((e) => e.clubId === c.id)
                    .slice(0, 3)
                    .map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{e.title}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(e.date)} • {e.registeredIds.length}/{e.capacity}
                          </p>
                        </div>
                        <Link to="/app/events">
                          <Button className="h-8 px-3 text-xs">Manage</Button>
                        </Link>
                      </div>
                    )),
                )}
              </div>
            </Card>
          </div>
        </section>
      ) : null}
      {user.role === "student" || user.role === "leader" ? (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Featured Clubs</h2>
              <Link to="/app/clubs" className="text-sm font-medium text-brand">
                View All
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  joined={club.memberIds.includes(user.id)}
                  pending={club.pendingMemberIds.includes(user.id)}
                  onJoin={() => void store.joinClub(club.id)}
                />
              ))}
            </div>
          </section>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 font-semibold text-slate-800">Upcoming Events</h2>
              <div className="space-y-3">
                {upcoming.map((event) => {
                  const isIn = event.registeredIds.includes(user.id);
                  return (
                    <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(event.date)} • {event.time}
                        </p>
                      </div>
                      <Link to={`/app/events/${event.id}`}>
                        <Button className="h-8 px-3 text-xs">{isIn ? "Registered" : "View"}</Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white p-5">
              <h2 className="font-semibold text-slate-800">Join More Clubs</h2>
              <Link to="/app/clubs">
                <Button className="mt-4">Browse Clubs</Button>
              </Link>
              <HeroArt className="mt-2 h-40" />
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </Card>
  );
}