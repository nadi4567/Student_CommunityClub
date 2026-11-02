import { FormEvent, useState } from "react";
import { Button, Card, Empty, Field, Input, Select, TextArea } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AnnouncementsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = store.clubs.filter((c) => c.leaderId === user.id);
  const [clubId, setClubId] = useState(led[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const items = store.announcements.filter((a) => a.clubId === clubId);

  if (user.role !== "leader" && user.role !== "admin") {
    return <Empty title="Leaders only" body="Announcements are available to club leaders." />;
  }

  if (!led[0]) {
    return <Empty title="No club to manage" body="Announcements are available once you lead a club." />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    store.publishAnnouncement(clubId, title, body);
    setTitle("");
    setBody("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Publish announcements</h1>
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
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Message">
            <TextArea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Button type="submit">Publish</Button>
        </form>
      </Card>
      {items.map((a) => (
        <Card key={a.id} className="p-4">
          <p className="font-semibold">{a.title}</p>
          <p className="mt-1 text-sm text-slate-500">{a.body}</p>
          <p className="mt-2 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
        </Card>
      ))}
    </div>
  );
}
