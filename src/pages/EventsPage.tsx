import { Link, useSearchParams } from "react-router-dom";
import { formatDate, monthDay } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Badge, Button, Card } from "@/components/ui";

export function EventsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <p className="text-sm text-slate-500">Register for workshops, matches, and meetups.</p>
      </div>
      {events.map((event) => {
        const club = store.clubs.find((c) => c.id === event.clubId);
        const md = monthDay(event.date);
        const registered = event.registeredIds.includes(user.id);
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
            {registered ? <Badge tone="green">Registered</Badge> : null}
            <Link to={`/app/events/${event.id}`}>
              <Button>{registered ? "View" : "Register"}</Button>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
