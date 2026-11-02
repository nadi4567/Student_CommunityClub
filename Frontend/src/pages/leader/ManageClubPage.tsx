import { FormEvent, useMemo, useState } from "react";
import { Button, Card, Empty, Field, Input, Select, TextArea } from "@/components/ui";
import { CATEGORIES } from "@/lib/seed";
import { useStore } from "@/lib/store";

export function ManageClubPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = store.clubs.filter((c) => c.leaderId === user.id);
  const [selectedId, setSelectedId] = useState(led[0]?.id ?? "");
  const [creating, setCreating] = useState(led.length === 0);
  const club = creating ? undefined : led.find((c) => c.id === selectedId) ?? led[0];

  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: club?.name ?? "",
    category: club?.category ?? "Arts & Design",
    tagline: club?.tagline ?? "",
    description: club?.description ?? "",
    location: club?.location ?? "",
    meetingTime: club?.meetingTime ?? "",
    activities: club?.activities.join("\n") ?? "",
  });

  const sync = (id: string) => {
    const next = led.find((c) => c.id === id);
    if (!next) return;
    setCreating(false);
    setSelectedId(id);
    setForm({
      name: next.name,
      category: next.category,
      tagline: next.tagline,
      description: next.description,
      location: next.location,
      meetingTime: next.meetingTime,
      activities: next.activities.join("\n"),
    });
  };

  const canManage = useMemo(() => user.role === "leader" || user.role === "admin", [user.role]);

  if (!canManage) {
    return <Empty title="Leaders only" body="This page is available after your leader request is approved." />;
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const activities = form.activities
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (club) {
      store.upsertClub({ id: club.id, ...form, activities });
    } else {
      const id = store.upsertClub({ ...form, activities });
      setSelectedId(id);
      setCreating(false);
    }
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{club ? "Edit Club" : "Create Club"}</h1>
        <div className="flex gap-2">
          {led.length > 0 ? (
            <Select value={creating ? "" : club?.id} onChange={(e) => sync(e.target.value)} className="w-56">
              {led.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setCreating(true);
              setSaved(false);
              setForm({
                name: "",
                category: "Arts & Design",
                tagline: "",
                description: "",
                location: "",
                meetingTime: "",
                activities: "",
              });
            }}
          >
            New club
          </Button>
        </div>
      </div>
      <Card className="p-6">
        <form onSubmit={save} className="space-y-4">
          <Field label="Club name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tagline">
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          </Field>
          <Field label="Description">
            <TextArea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Meeting time">
            <Input value={form.meetingTime} onChange={(e) => setForm({ ...form, meetingTime: e.target.value })} />
          </Field>
          <Field label="Activities (one per line)">
            <TextArea rows={4} value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} />
          </Field>
          <Button type="submit">{club ? "Save changes" : "Create club"}</Button>
          {saved ? <p className="text-sm text-emerald-600">Club details saved.</p> : null}
        </form>
      </Card>
    </div>
  );
}
