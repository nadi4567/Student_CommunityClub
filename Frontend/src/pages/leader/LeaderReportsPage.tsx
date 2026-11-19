import { useEffect, useMemo, useState } from "react";
import { Card, Empty } from "@/components/ui";
import type { LeaderDashboardStats } from "@/lib/types";
import { useStore } from "@/lib/store";

export function LeaderReportsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = useMemo(() => {
    const fromApi = store.leaderClubs ?? [];
    return fromApi.length > 0 ? fromApi : store.clubs.filter((c) => c.leaderId === user.id);
  }, [store.clubs, store.leaderClubs, user.id]);
  const [stats, setStats] = useState<LeaderDashboardStats | null>(null);

  useEffect(() => {
    void store.getLeaderDashboard().then(setStats);
  }, [store]);

  const eventCount = store.events.filter((e) => led.some((c) => c.id === e.clubId)).length;
  const memberCount = led.reduce((sum, c) => sum + c.memberIds.length, 0);

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="Overview stats for your clubs." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Club reports</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{led.length}</p>
          <p className="text-xs text-slate-500">Clubs led</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{stats?.totalMembers ?? memberCount}</p>
          <p className="text-xs text-slate-500">Total members</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{stats?.pendingRequests ?? 0}</p>
          <p className="text-xs text-slate-500">Pending join requests</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-slate-900">{stats?.upcomingEvents ?? eventCount}</p>
          <p className="text-xs text-slate-500">Upcoming / total events</p>
        </Card>
        <Card className="p-4 sm:col-span-2">
          <p className="text-2xl font-bold text-slate-900">{stats?.totalRegistrations ?? 0}</p>
          <p className="text-xs text-slate-500">Event registrations across your clubs</p>
        </Card>
      </div>
    </div>
  );
}