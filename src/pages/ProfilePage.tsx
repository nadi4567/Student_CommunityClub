import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

const tabs = ["Personal Info", "My Clubs", "My Events", "Leader Requests"] as const;

export function ProfilePage() {
  const store = useStore();
  const user = store.currentUser!;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Personal Info");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const clubs = store.clubs.filter((c) => c.memberIds.includes(user.id));
  const events = store.events.filter((e) => e.registeredIds.includes(user.id));
  const requests = store.leaderRequests.filter((r) => r.userId === user.id);
  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Manage your personal information.</p>
      </div>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-lg font-bold text-white">
              {user.avatar}
            </span>
            <div>
              <p className="text-lg font-bold">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit Profile"}
          </Button>
        </div>
        <div className="mt-6 flex gap-6 border-b border-slate-100 text-sm">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 ${
                tab === t ? "border-brand font-semibold text-brand" : "border-transparent text-slate-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            {tab === "Personal Info" ? (
              editing ? (
                <div className="max-w-md space-y-3">
                  <Field label="Full name">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Phone">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                  <Button
                    onClick={() => {
                      store.updateUser(user.id, { name, phone });
                      setEditing(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p className="font-semibold text-slate-800">Personal Information</p>
                  <Row label="Full Name" value={user.name} />
                  <Row label="Email" value={user.email} />
                  <Row label="Phone" value={user.phone || "—"} />
                  <Row label="Member Since" value={user.memberSince} />
                  <Row label="Role" value={user.role} />
                </div>
              )
            ) : null}
            {tab === "My Clubs" ? (
              <ul className="space-y-2 text-sm">
                {clubs.map((c) => (
                  <li key={c.id}>
                    <Link to={`/app/clubs/${c.id}`} className="text-brand">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {tab === "My Events" ? (
              <ul className="space-y-2 text-sm">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link to={`/app/events/${e.id}`} className="text-brand">
                      {e.title}
                    </Link>{" "}
                    <span className="text-slate-400">• {formatDate(e.date)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {tab === "Leader Requests" ? (
              <div className="space-y-3">
                {requests.length === 0 ? (
                  <p className="text-sm text-slate-500">No requests yet.</p>
                ) : (
                  requests.map((r) => (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{r.clubName}</p>
                        <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "rose" : "amber"}>
                          {r.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{r.reason}</p>
                    </Card>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <p className="font-semibold">Request Club Leader Role</p>
              <p className="mt-1 text-sm text-slate-500">
                Want to become a club leader? Submit a request so the admin can review you and take the next
                step.
              </p>
              <Link to="/app/leader-request">
                <Button className="mt-3 w-full">Request Now</Button>
              </Link>
            </Card>
            <Card className="p-4">
              <p className="font-semibold">My Leader Requests</p>
              <p className="mt-2 text-sm text-slate-500">
                {pending.length === 0 ? "No requests yet" : `${pending.length} pending`}
              </p>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
