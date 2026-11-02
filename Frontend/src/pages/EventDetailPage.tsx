import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Flag, MapPin, Share2, Users } from "lucide-react";
import { Button, Card, Empty, TextArea } from "@/components/ui";
import { formatDate, monthDay } from "@/lib/format";
import { useStore } from "@/lib/store";

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const user = store.currentUser;
  const event = store.events.find((e) => e.id === id);
  const [copied, setCopied] = useState(false);
  const [reason, setReason] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  if (!event) return <Empty title="Event not found" body="This event may have been cancelled." />;

  const club = store.clubs.find((c) => c.id === event.clubId);
  const related = store.events.filter((e) => e.clubId === event.clubId && e.id !== event.id).slice(0, 3);
  const registered = user ? event.registeredIds.includes(user.id) : false;
  const md = monthDay(event.date);
  const full = event.registeredIds.length >= event.capacity;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_300px]">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="relative h-64">
          <img src={event.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute left-6 top-6 grid h-16 w-16 place-items-center rounded-2xl bg-white text-center shadow">
            <span className="text-[10px] font-bold text-brand">{md.month}</span>
            <span className="text-xl font-extrabold">{md.day}</span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500">
            {club?.name} • {club?.category}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{event.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {formatDate(event.date)} • {event.time}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4" /> {event.location}
          </p>
          <p className="mt-4 text-slate-600">{event.description}</p>
          <div className="mt-6 space-y-2 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Event Details</p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand" /> Location {event.location}
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" /> Capacity {event.registeredIds.length}/{event.capacity}{" "}
              participants
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand" /> Registration Deadline {formatDate(event.deadline)}
            </p>
          </div>
          {reportOpen ? (
            <div className="mt-4 space-y-2">
              <TextArea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the issue"
              />
              <Button
                onClick={() => {
                  if (!reason.trim()) return;
                  store.reportContent({ targetType: "event", targetId: event.id, reason });
                  setReason("");
                  setReportOpen(false);
                }}
              >
                Submit report
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="space-y-4">
        <Card className="p-4">
          {registered ? (
            <Button className="w-full" variant="secondary" onClick={() => store.unregisterEvent(event.id)}>
              Cancel registration
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={full}
              onClick={() =>
                user
                  ? store.registerEvent(event.id)
                  : (window.location.href = `/login?next=${encodeURIComponent(`/app/events/${event.id}`)}`)
              }
            >
              {full ? "Event full" : "Register For Event"}
            </Button>
          )}
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
            }}
          >
            <Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Share"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setReportOpen((v) => !v)}>
            <Flag className="h-4 w-4" /> Report event
          </Button>
        </Card>
        <Card className="p-4">
          <p className="mb-3 font-semibold">Related Events</p>
          <div className="space-y-3">
            {related.map((item) => (
              <Link key={item.id} to={`/app/events/${item.id}`} className="flex gap-3">
                <img src={item.image} alt="" className="h-14 w-20 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
