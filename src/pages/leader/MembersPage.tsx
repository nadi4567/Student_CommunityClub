import { useState } from "react";
import { Badge, Button, Card, Empty, Select } from "@/components/ui";
import { useStore } from "@/lib/store";

export function MembersPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = store.clubs.filter((c) => c.leaderId === user.id);
  const [clubId, setClubId] = useState(led[0]?.id ?? "");
  const club = led.find((c) => c.id === clubId) ?? led[0];

  const requests = store.membershipRequests.filter(
    (r) => r.clubId === club?.id && r.status === "pending",
  );
  const members = store.users.filter((u) => club?.memberIds.includes(u.id));

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="Approve memberships after your leader request is approved." />;
  }

  if (!club) {
    return <Empty title="No club to manage" body="Create a club or wait for an approved leader request." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Manage members</h1>
        {led.length > 1 ? (
          <Select value={club.id} onChange={(e) => setClubId(e.target.value)} className="w-56">
            {led.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Membership requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const applicant = store.users.find((u) => u.id === r.userId);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="font-medium">{applicant?.name}</p>
                    <p className="text-xs text-slate-500">{applicant?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => store.reviewMembership(r.id, "approved")}>Approve</Button>
                    <Button variant="danger" onClick={() => store.reviewMembership(r.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Current members</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-brand">
                  {m.avatar}
                </span>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
              </div>
              {m.id === club.leaderId ? (
                <Badge>Leader</Badge>
              ) : (
                <Button variant="ghost" onClick={() => store.removeMember(club.id, m.id)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
