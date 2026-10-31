import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Camera, Flag, MapPin, Users } from "lucide-react";
import { Badge, Button, Card, Empty, TextArea } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

const tabs = ["About", "Events", "Members", "Announcements"] as const;

export function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const user = store.currentUser;
  const club = store.clubs.find((c) => c.id === id);
  const leader = store.users.find((u) => u.id === club?.leaderId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("About");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!club) return <Empty title="Club not found" body="This club may have been removed." />;

  const joined = user ? club.memberIds.includes(user.id) : false;
  const pending = user ? club.pendingMemberIds.includes(user.id) : false;
  const events = store.events.filter((e) => e.clubId === club.id);
  const announcements = store.announcements.filter((a) => a.clubId === club.id);
  const members = store.users.filter((u) => club.memberIds.includes(u.id));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="relative h-56">
          <img src={club.cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute -bottom-8 left-8 grid h-16 w-16 place-items-center rounded-2xl bg-white shadow">
            <Camera className="h-7 w-7 text-brand" />
          </div>
        </div>
        <div className="grid gap-6 px-8 pb-6 pt-12 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{club.name}</h1>
              <Badge>{club.category}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-slate-500">{club.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {joined ? (
                <Button variant="secondary">Joined</Button>
              ) : pending ? (
                <Button variant="secondary">Request pending</Button>
              ) : (
                <Button
                  onClick={() =>
                    user
                      ? store.joinClub(club.id)
                      : (window.location.href = `/login?next=${encodeURIComponent(`/app/clubs/${club.id}`)}`)
                  }
                >
                  Join Club
                </Button>
              )}
              <a href={`mailto:${leader?.email ?? ""}`}>
                <Button variant="outline">Contact Leader</Button>
              </a>
              <Button variant="ghost" onClick={() => setReportOpen((v) => !v)}>
                <Flag className="h-4 w-4" /> Report
              </Button>
            </div>
            {reportOpen ? (
              <div className="mt-4 max-w-lg space-y-2">
                <TextArea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you reporting this club?"
                />
                <Button
                  onClick={() => {
                    if (!reason.trim()) return;
                    store.reportContent({ targetType: "club", targetId: club.id, reason });
                    setReason("");
                    setReportOpen(false);
                  }}
                >
                  Submit report
                </Button>
              </div>
            ) : null}
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
            <div className="py-5">
              {tab === "About" ? (
                <div>
                  <h3 className="font-semibold text-slate-800">Our Activities</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {club.activities.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {tab === "Events" ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/app/events/${event.id}`}
                      className="flex gap-3 rounded-xl hover:bg-slate-50"
                    >
                      <img src={event.image} alt="" className="h-16 w-24 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
              {tab === "Members" ? (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-brand">
                        {m.avatar}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.id === club.leaderId ? "Club Leader" : "Member"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {tab === "Announcements" ? (
                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <p className="text-sm text-slate-500">No announcements yet.</p>
                  ) : (
                    announcements.map((a) => (
                      <Card key={a.id} className="p-4">
                        <p className="font-medium">{a.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{a.body}</p>
                      </Card>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <aside className="space-y-4">
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Club Leader</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-xs font-bold text-white">
                  {leader?.avatar}
                </span>
                <div>
                  <p className="font-medium">{leader?.name}</p>
                  <p className="text-xs text-slate-500">{leader?.email}</p>
                </div>
              </div>
            </Card>
            <Card className="space-y-3 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Club Info</p>
              <p className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-brand" /> {club.location}
              </p>
              <p className="text-slate-600">Founded {club.founded}</p>
              <p className="text-slate-600">{club.meetingTime}</p>
              <p className="flex items-center gap-2 text-slate-600">
                <Users className="h-4 w-4 text-brand" /> {club.memberIds.length} members
              </p>
            </Card>
            <img src={club.image} alt="" className="h-36 w-full rounded-2xl object-cover" />
          </aside>
        </div>
      </div>
    </div>
  );
}
