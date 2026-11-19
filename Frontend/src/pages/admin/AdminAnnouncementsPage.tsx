import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button, Card, Empty, Field, Input, TextArea } from "@/components/ui";
import type { PlatformAnnouncement } from "@/lib/types";
import { useStore } from "@/lib/store";

export function AdminAnnouncementsPage() {
  const store = useStore();
  const [items, setItems] = useState<PlatformAnnouncement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    const list = await store.getPlatformAnnouncements();
    setItems(list);
  }, [store]);

  useEffect(() => {
    void load();
  }, [load]);

  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="Platform-wide announcements for all users." />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void store.createPlatformAnnouncement(title, body).then(() => {
      setTitle("");
      setBody("");
      void load();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Platform announcements</h1>
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
        <Card key={a.id} className="flex items-start justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{a.title}</p>
            <p className="mt-1 text-sm text-slate-500">{a.body}</p>
            {a.createdAt ? (
              <p className="mt-2 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
            ) : null}
          </div>
          <Button
            variant="danger"
            className="shrink-0"
            onClick={() => void store.deletePlatformAnnouncement(a.id).then(load)}
          >
            Delete
          </Button>
        </Card>
      ))}
    </div>
  );
}