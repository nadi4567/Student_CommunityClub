import { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Select } from "@/components/ui";
import { useStore } from "@/lib/store";

export function JoinRequestsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = useMemo(() => {
    const fromApi = store.leaderClubs ?? [];
    return fromApi.length > 0 ? fromApi : store.clubs.filter((c) => c.leaderId === user.id);
  }, [store.clubs, store.leaderClubs, user.id]);
  const [clubId, setClubId] = useState(led[0]?.id ?? "");

  useEffect(() => {
    void store.refreshState();
    void store.getLeaderClubs();
  }, [store]);

  useEffect(() => {
    if (!clubId && led[0]) setClubId(led[0].id);
  }, [clubId, led]);

  const requests = store.membershipRequests.filter(
    (r) => r.clubId === clubId && r.status === "pending",
  );

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="Review join requests for clubs you lead." />;
  }

  if (!led[0]) {
    return <Empty title="No club" body="Create or get approval for a club first." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Join requests</h1>
        {led.length > 1 ? (
          <Select value={clubId} onChange={(e) => setClubId(e.target.value)} className="w-56">
            {led.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      <Card className="p-5">
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests for this club.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const applicant = store.users.find((u) => u.id === r.userId);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium">{applicant?.name ?? `User #${r.userId}`}</p>
                    <p className="text-xs text-slate-500">{applicant?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void store.reviewMembership(r.id, "approved")}>Approve</Button>
                    <Button variant="danger" onClick={() => void store.reviewMembership(r.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}