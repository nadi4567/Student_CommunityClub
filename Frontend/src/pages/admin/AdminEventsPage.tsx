import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Empty } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export function AdminEventsPage() {
  const store = useStore();

  useEffect(() => {
    void store.getAdminEvents();
  }, [store]);

  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="Manage all platform events." />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">All events</h1>
      {store.events.length === 0 ? (
        <Empty title="No events" body="Events created by club leaders appear here." />
      ) : (
        store.events.map((event) => {
          const club = store.clubs.find((c) => c.id === event.clubId);
          return (
            <Card key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-slate-500">
                  {club?.name ?? event.clubId} • {formatDate(event.date)} • {event.registeredIds.length} registered
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/app/events/${event.id}`}>
                  <Button type="button" variant="secondary">
                    View
                  </Button>
                </Link>
                <Button type="button" variant="danger" onClick={() => void store.deleteAdminEvent(event.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}