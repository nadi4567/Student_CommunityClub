import { useEffect, useMemo, useState } from "react";
import { Button, Card, Empty, Select } from "@/components/ui";
import type { EventRegistrationRow } from "@/lib/types";
import { useStore } from "@/lib/store";

export function AttendancePage() {
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

  useEffect(() => {
    void store.getLeaderClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (led.length === 0) {
      setClubId("");
      return;
    }
    if (!clubId || !led.some((c) => c.id === clubId)) {
      setClubId(led[0].id);
    }
  }, [led, clubId]);

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
      return;
    }
    let cancelled = false;

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
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="Mark attendance for event registrants." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
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
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">Select an event with registrations.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-brand">
                    {r.avatar || r.name.slice(0, 2).toUpperCase()}
                  </span>
                  <p className="text-sm font-medium">{r.name}</p>
                </div>
                <Button
                  variant={r.attended ? "secondary" : "outline"}
                  className="text-xs"
                  onClick={() =>
                    void store.markAttendance(eventId, r.id, !r.attended).then(() =>
                      store.getEventRegistrations(eventId).then(setRows),
                    )
                  }
                >
                  {r.attended ? "Present" : "Mark present"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
