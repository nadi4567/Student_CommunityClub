import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { EventForm } from "@/components/EventForm";
import { formatDate, monthDay } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Badge, Button, Card } from "@/components/ui";

export function EventsPage() {
  const store = useStore();
  const user = store.currentUser;
  const { pathname } = useLocation();
  const eventBase = pathname.startsWith("/app") ? "/app/events" : "/events";
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const led = user ? store.clubs.filter((c) => c.leaderId === user.id) : [];
  const canManage = led.length > 0;
  const [formOpen, setFormOpen] = useState(false);

  const events = [...store.events]
    .filter((event) => {
      const club = store.clubs.find((c) => c.id === event.clubId);
      return (
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        (club?.name.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-sm text-slate-500">
            {canManage
              ? "Browse all events. Open an event to edit or delete ones you host."
              : user?.role === "admin"
                ? "Browse workshops, matches, and meetups."
                : "Register for workshops, matches, and meetups."}
          </p>
        </div>
        {canManage ? (
          formOpen ? (
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Back to events
            </Button>
          ) : (
            <Button type="button" onClick={() => setFormOpen(true)}>
              Create event
            </Button>
          )
        ) : null}
      </div>

      {formOpen && canManage ? (
        <EventForm clubs={led} onCancel={() => setFormOpen(false)} onSaved={() => setFormOpen(false)} />
      ) : (
        events.map((event) => {
          const club = store.clubs.find((c) => c.id === event.clubId);
          const md = monthDay(event.date);
          const isHost = Boolean(user && club?.leaderId === user.id);
          const registered = Boolean(
            user && user.role !== "admin" && !isHost && event.registeredIds.includes(user.id),
          );
          return (
            <Card key={event.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-50 text-center">
                <span className="text-[10px] font-bold text-brand">{md.month}</span>
                <span className="text-xl font-extrabold text-slate-900">{md.day}</span>
              </div>
              <img src={event.image} alt="" className="h-16 w-28 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{event.title}</p>
                <p className="text-sm text-slate-500">
                  {club?.name} • {formatDate(event.date)} • {event.time}
                </p>
              </div>
              {isHost ? <Badge>Hosting</Badge> : registered ? <Badge tone="green">Registered</Badge> : null}
              <Link to={`${eventBase}/${event.id}`}>
                <Button>View</Button>
              </Link>
            </Card>
          );
        })
      )}
    </div>
  );
}
