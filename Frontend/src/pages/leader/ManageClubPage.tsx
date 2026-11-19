import { FormEvent, useMemo, useState } from "react";
import { MapPin, Users } from "lucide-react";
import { Button, Card, Empty, Field, Input, Select, TextArea } from "@/components/ui";
import { CATEGORIES } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Club } from "@/lib/types";

const blankForm = {
  name: "",
  category: "Arts & Design",
  tagline: "",
  description: "",
  location: "",
  meetingTime: "",
  activities: "",
  image: "",
};

function formFromClub(club: Club) {
  return {
    name: club.name,
    category: club.category,
    tagline: club.tagline,
    description: club.description,
    location: club.location,
    meetingTime: club.meetingTime,
    activities: club.activities.join("\n"),
    image: club.image,
  };
}

export function ManageClubPage() {
  const store = useStore();
  const user = store.currentUser!;
  const led = store.clubs.filter((c) => c.leaderId === user.id);
  const [mode, setMode] = useState<"list" | "edit" | "create">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [imageError, setImageError] = useState("");
  const [form, setForm] = useState(blankForm);
  const editing = led.find((club) => club.id === editingId);

  const canManage = useMemo(() => user.role === "leader" || user.role === "admin", [user.role]);

  if (!canManage) {
    return <Empty title="Leaders only" body="This page is available after your leader request is approved." />;
  }

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setSaved("");
    setImageError("");
    setForm(blankForm);
  }

  function openEdit(club: Club) {
    setMode("edit");
    setEditingId(club.id);
    setSaved("");
    setImageError("");
    setForm(formFromClub(club));
  }

  function backToList() {
    setMode("list");
    setEditingId(null);
    setImageError("");
  }

  function onImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Choose a JPG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError("Choose an image under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: String(reader.result ?? "") }));
      setImageError("");
    };
    reader.readAsDataURL(file);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const activities = form.activities
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!form.image || (mode === "create" && !form.image.startsWith("data:image/"))) {
      setImageError("Upload a club image.");
      return;
    }
    if (mode === "edit" && editing) {
      await store.upsertClub({ id: editing.id, ...form, activities });
      setSaved(`${form.name} was updated.`);
    } else {
      await store.upsertClub({ ...form, activities });
      setSaved(`${form.name} was created.`);
    }
    setMode("list");
    setEditingId(null);
  }

  if (mode === "list") {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Clubs</h1>
            <p className="text-sm text-slate-500">Clubs you lead.</p>
          </div>
          <Button type="button" onClick={openCreate}>
            Create new
          </Button>
        </div>
        {saved ? <p className="text-sm font-medium text-emerald-600">{saved}</p> : null}
        {led.length === 0 ? (
          <Empty title="No clubs yet" body="Create a club to start adding members and events." />
        ) : (
          <div className="space-y-3">
            {led.map((club) => (
              <Card key={club.id} className="flex flex-wrap items-center gap-4 p-4">
                <img src={club.image} alt="" className="h-20 w-32 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{club.name}</p>
                  <p className="text-sm text-slate-500">{club.category}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{club.tagline}</p>
                  <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {club.memberIds.length} members
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {club.location || "Main Campus"}
                    </span>
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={() => openEdit(club)}>
                  Edit
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{mode === "edit" ? "Edit Club" : "Create Club"}</h1>
        <Button type="button" variant="secondary" onClick={backToList}>
          Back to my clubs
        </Button>
      </div>
      <Card className="p-6">
        <form onSubmit={save} className="space-y-4">
          <Field label="Club image">
            <Input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => onImage(e.target.files?.[0])} />
            {form.image ? <img src={form.image} alt="" className="mt-3 h-32 w-52 rounded-xl object-cover" /> : null}
            {imageError ? <p className="mt-1 text-sm text-rose-600">{imageError}</p> : null}
          </Field>
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
          <Button type="submit">{mode === "edit" ? "Save changes" : "Create club"}</Button>
        </form>
      </Card>
    </div>
  );
}
