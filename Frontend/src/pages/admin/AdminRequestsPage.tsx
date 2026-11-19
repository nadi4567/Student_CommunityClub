import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AdminRequestsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const [selectedId, setSelectedId] = useState<string | null>(
    store.leaderRequests.find((r) => r.status === "pending")?.id ?? store.leaderRequests[0]?.id ?? null,
  );
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pickedPending = useRef(false);
  const pending = store.leaderRequests.filter((r) => r.status === "pending");
  const selected = store.leaderRequests.find((r) => r.id === selectedId);
  const applicant = store.users.find((u) => u.id === selected?.userId);

  useEffect(() => {
    if (user.role !== "admin") return;
    void store.getAdminLeaderRequests();
    void store.getAdminUsers();
  }, [user.id, user.role]);

  useEffect(() => {
    const pendingOne = store.leaderRequests.find((r) => r.status === "pending");
    if (!pickedPending.current && pendingOne) {
      pickedPending.current = true;
      setSelectedId(pendingOne.id);
      return;
    }
    if (selectedId && store.leaderRequests.some((r) => r.id === selectedId)) return;
    const next = pendingOne ?? store.leaderRequests[0];
    if (next) setSelectedId(next.id);
  }, [store.leaderRequests, selectedId]);

  async function review(status: "approved" | "rejected") {
    if (!selected || busy) return;
    setBusy(status);
    setError(null);
    const message = await store.reviewLeaderRequest(selected.id, status);
    setBusy(null);
    if (message) setError(message);
  }

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
                  type="button"
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Review applicant</h2>
            {selected.status === "pending" ? (
              <div className="flex gap-3">
                <Button
                  type="button"
                  className="min-h-11 min-w-32"
                  disabled={busy !== null}
                  onClick={() => void review("approved")}
                >
                  {busy === "approved" ? "Approving..." : "Approve"}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="min-h-11 min-w-32"
                  disabled={busy !== null}
                  onClick={() => void review("rejected")}
                >
                  {busy === "rejected" ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500">This request was {selected.status}.</p>
            )}
          </div>
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
          {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}
