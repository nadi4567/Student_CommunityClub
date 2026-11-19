import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export function HistoryPage() {
  const store = useStore();
  const user = store.currentUser!;
  const clubs = store.clubs.filter((c) => c.memberIds.includes(user.id));
  const events = store.events.filter((e) => e.registeredIds.includes(user.id));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Participation history</h1>
        <p className="text-sm text-slate-500">Clubs you joined and events you registered for.</p>
      </div>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Joined clubs</h2>
        {clubs.length === 0 ? (
          <p className="text-sm text-slate-500">No club memberships yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {clubs.map((c) => (
              <li key={c.id}>
                <Link to={`/app/clubs/${c.id}`} className="font-medium text-brand hover:underline">
                  {c.name}
                </Link>
                <span className="text-slate-400"> • {c.category}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Registered events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No event registrations yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id}>
                <Link to={`/app/events/${e.id}`} className="font-medium text-brand hover:underline">
                  {e.title}
                </Link>
                <span className="text-slate-400"> • {formatDate(e.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}