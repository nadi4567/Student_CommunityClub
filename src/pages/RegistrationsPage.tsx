import { Link } from "react-router-dom";
import { Button, Card, Empty } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export function RegistrationsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const events = store.events.filter((e) => e.registeredIds.includes(user.id));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">My Registrations</h1>
      {events.length === 0 ? (
        <Empty title="No registrations yet" body="Browse events and register for the ones you want to attend." />
      ) : (
        events.map((event) => (
          <Card key={event.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-slate-500">
                {formatDate(event.date)} • {event.time} • {event.location}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/app/events/${event.id}`}>
                <Button variant="secondary">View</Button>
              </Link>
              <Button variant="danger" onClick={() => store.unregisterEvent(event.id)}>
                Cancel
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
