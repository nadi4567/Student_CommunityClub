import { useState } from "react";
import { Badge, Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AdminRequestsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const [selectedId, setSelectedId] = useState<string | null>(
    store.leaderRequests.find((r) => r.status === "pending")?.id ?? store.leaderRequests[0]?.id ?? null,
  );
  const pending = store.leaderRequests.filter((r) => r.status === "pending");
  const selected = store.leaderRequests.find((r) => r.id === selectedId);
  const applicant = store.users.find((u) => u.id === selected?.userId);

  if (user.role !== "admin") {
    return <Empty title="Admins only" body="You need an admin account to review leader requests." />;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[320px_1fr]">
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Pending leader requests</h1>
        <div className="space-y-3">
          {store.leaderRequests.length === 0 ? (
            <Empty title="No requests" body="New club leader applications will show up here." />
          ) : (
            store.leaderRequests.map((r) => {
              const person = store.users.find((u) => u.id === r.userId);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    selectedId === r.id ? "border-brand bg-violet-50" : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{person?.name}</p>
                    <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "rose" : "amber"}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{r.clubName}</p>
                </button>
              );
            })
          )}
        </div>
        <p className="mt-4 text-sm text-slate-500">{pending.length} waiting for review</p>
      </div>
      {selected && applicant ? (
        <Card className="p-6">
          <h2 className="text-xl font-bold">Review applicant</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Applicant details</p>
              <p>Name: {applicant.name}</p>
              <p>Email: {applicant.email}</p>
              <p>Phone: {applicant.phone || "—"}</p>
              <p>Member since: {applicant.memberSince}</p>
              <p>Current role: {applicant.role}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Proposed club</p>
              <p>Name: {selected.clubName}</p>
              <p>Category: {selected.category}</p>
              <p>Document: {selected.documentName || "None uploaded"}</p>
              <p>Submitted: {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{selected.reason}</p>
          {selected.status === "pending" ? (
            <div className="mt-6 flex gap-3">
              <Button onClick={() => store.reviewLeaderRequest(selected.id, "approved")}>Approve</Button>
              <Button variant="danger" onClick={() => store.reviewLeaderRequest(selected.id, "rejected")}>
                Reject
              </Button>
            </div>
          ) : (
            <p className="mt-6 text-sm font-medium text-slate-500">This request was {selected.status}.</p>
          )}
        </Card>
      ) : null}
    </div>
  );
}
