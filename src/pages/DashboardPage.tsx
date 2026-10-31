import { Link } from "react-router-dom";
import { Bell, CalendarDays, ClipboardList, Flag, Users } from "lucide-react";
import { ClubCard } from "@/components/ClubCard";
import { HeroArt } from "@/components/HeroArt";
import { Button, Card } from "@/components/ui";
import { firstName, formatDate, greeting } from "@/lib/format";
import { unreadCount, useStore } from "@/lib/store";

export function DashboardPage() {
  const store = useStore();
  const user = store.currentUser!;
  const myClubs = store.clubs.filter((c) => c.memberIds.includes(user.id));
  const registered = store.events.filter((e) => e.registeredIds.includes(user.id));
  const upcoming = [...store.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const myRequests = store.leaderRequests.filter((r) => r.userId === user.id);
  const unread = unreadCount(store.notifications, user.id);
  const featured = store.clubs.slice(0, 3);
  const pendingMemberships = store.membershipRequests.filter((r) => {
    const club = store.clubs.find((c) => c.id === r.clubId);
    return r.status === "pending" && club?.leaderId === user.id;
  });
  const pendingLeaders = store.leaderRequests.filter((r) => r.status === "pending");
  const openReports = store.reports.filter((r) => r.status === "open");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting()}, {firstName(user.name)}!
        </h1>
        <p className="text-sm text-slate-500">Welcome back to your community.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="My Clubs" value={myClubs.length} />
        <Stat icon={CalendarDays} label="Upcoming Events" value={registered.length} />
        <Stat icon={ClipboardList} label="My Requests" value={myRequests.length} />
        <Stat icon={Bell} label="Notifications" value={unread} />
      </div>
      {user.role === "leader" ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-600">
            {pendingMemberships.length} membership request{pendingMemberships.length === 1 ? "" : "s"} waiting
            for review.
          </p>
          <Link to="/app/leader/members">
            <Button>Review members</Button>
          </Link>
        </Card>
      ) : null}
      {user.role === "admin" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-brand">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-bold">{pendingLeaders.length}</p>
                <p className="text-xs text-slate-500">Pending leader requests</p>
              </div>
            </div>
            <Link to="/app/admin/requests">
              <Button>Review</Button>
            </Link>
          </Card>
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-brand">
                <Flag className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xl font-bold">{openReports.length}</p>
                <p className="text-xs text-slate-500">Open content reports</p>
              </div>
            </div>
            <Link to="/app/admin/reports">
              <Button variant="secondary">Monitor</Button>
            </Link>
          </Card>
        </div>
      ) : null}
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
              onJoin={() => store.joinClub(club.id)}
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
                    <Button className="h-8 px-3 text-xs">{isIn ? "View" : "Register"}</Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white p-5">
          <h2 className="font-semibold text-slate-800">Join More Clubs</h2>
          <p className="mt-1 text-sm text-slate-500">Explore different clubs and find your community today!</p>
          <Link to="/app/clubs">
            <Button className="mt-4">Browse Clubs</Button>
          </Link>
          <HeroArt className="mt-2 h-40" />
        </Card>
      </div>
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
