import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Select } from "@/components/ui";
import type { EventRegistrationRow } from "@/lib/types";
import { useStore } from "@/lib/store";

export function LeaderRegistrationsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = useMemo(() => {
    const fromApi = store.leaderClubs ?? [];
    return fromApi.length > 0 ? fromApi : store.clubs.filter((c) => c.leaderId === user.id);
  }, [store.clubs, store.leaderClubs, user.id]);

  const [clubId, setClubId] = useState("");
  const clubEvents = useMemo(
    () => store.events.filter((e) => e.clubId === clubId),
    [store.events, clubId],
  );
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState<EventRegistrationRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void store.getLeaderClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep club selection in sync when leader clubs load / change
  useEffect(() => {
    if (led.length === 0) {
      setClubId("");
      return;
    }
    if (!clubId || !led.some((c) => c.id === clubId)) {
      const withRegs = led.find((c) =>
        store.events.some((e) => e.clubId === c.id && e.registeredIds.length > 0),
      );
      const withEvents = led.find((c) => store.events.some((e) => e.clubId === c.id));
      setClubId((withRegs ?? withEvents ?? led[0]).id);
    }
  }, [led, clubId, store.events]);

  // Keep event selection in sync when club or events change
  useEffect(() => {
    if (clubEvents.length === 0) {
      setEventId("");
      return;
    }
    if (!eventId || !clubEvents.some((e) => e.id === eventId)) {
      setEventId(clubEvents[0].id);
    }
  }, [clubEvents, eventId]);

  useEffect(() => {
    if (!eventId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const fromLocal = (): EventRegistrationRow[] => {
      const event = store.events.find((e) => e.id === eventId);
      const ids = event?.registeredIds ?? [];
      return ids.map((id) => {
        const u = store.users.find((x) => x.id === id);
        return {
          id,
          name: u?.name ?? `User #${id}`,
          email: u?.email ?? "",
          avatar: u?.avatar ?? "",
          attended: event?.attendedIds?.includes(id) ? 1 : 0,
        };
      });
    };

    void store.getEventRegistrations(eventId).then((list) => {
      if (cancelled) return;
      setRows(list.length > 0 ? list : fromLocal());
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // Only re-fetch when the selected event changes (store identity changes every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="View registrants for your club events." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Event registrations</h1>
      <div className="flex flex-wrap gap-3">
        <Select
          value={clubId}
          onChange={(e) => {
            setClubId(e.target.value);
            setEventId("");
          }}
          className="w-56"
        >
          {led.length === 0 ? <option value="">No clubs</option> : null}
          {led.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)} className="min-w-[200px]">
          {clubEvents.length === 0 ? <option value="">No events</option> : null}
          {clubEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.registeredIds.length})
            </option>
          ))}
        </Select>
      </div>
      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No registrations for this event.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-brand">
                  {r.avatar || r.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
