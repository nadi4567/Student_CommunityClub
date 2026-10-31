import { FormEvent, useState } from "react";
import { Button, Card, Empty, Field, Input, Select, TextArea } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export function LeaderEventsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = store.clubs.filter((c) => c.leaderId === user.id);
  const [clubId, setClubId] = useState(led[0]?.id ?? "");
  const events = store.events.filter((e) => e.clubId === clubId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("30");
  const [deadline, setDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="Event management is available to club leaders." />;
  }

  if (!led[0]) {
    return <Empty title="No club to manage" body="You need an approved club before creating events." />;
  }

  function reset() {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
    setCapacity("30");
    setDeadline("");
    setEditingId(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    store.saveEvent({
      id: editingId ?? undefined,
      clubId,
      title,
      description,
      date,
      time,
      location,
      capacity: Number(capacity) || 30,
      deadline: deadline || date,
    });
    reset();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Create and manage events</h1>
        {led.length > 1 ? (
          <Select value={clubId} onChange={(e) => setClubId(e.target.value)} className="w-56">
            {led.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Location">
            <Input required value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Date">
            <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time">
            <Input required value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM - 12:00 PM" />
          </Field>
          <Field label="Capacity">
            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </Field>
          <Field label="Registration deadline">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit">{editingId ? "Update event" : "Create event"}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-slate-500">
                {formatDate(event.date)} • {event.registeredIds.length}/{event.capacity} registered
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(event.id);
                  setTitle(event.title);
                  setDescription(event.description);
                  setDate(event.date);
                  setTime(event.time);
                  setLocation(event.location);
                  setCapacity(String(event.capacity));
                  setDeadline(event.deadline);
                }}
              >
                Edit
              </Button>
              <Button variant="danger" onClick={() => store.deleteEvent(event.id)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
