import { FormEvent, useState } from "react";
import { Button, Card, Field, Input, Select, TextArea } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Club, ClubEvent } from "@/lib/types";

export function EventForm({
  clubs,
  event,
  onCancel,
  onSaved,
}: {
  clubs: Club[];
  event?: ClubEvent;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const store = useStore();
  const [clubId, setClubId] = useState(event?.clubId ?? clubs[0]?.id ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(event?.date ?? "");
  const [time, setTime] = useState(event?.time ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 30));
  const [deadline, setDeadline] = useState(event?.deadline ?? "");
  const [image, setImage] = useState(event?.image ?? "");
  const [imageError, setImageError] = useState("");

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
      setImage(String(reader.result ?? ""));
      setImageError("");
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clubId) return;
    if (!image) {
      setImageError("Upload an event image.");
      return;
    }
    await store.saveEvent({
      id: event?.id,
      clubId,
      title,
      description,
      date,
      time,
      location,
      image,
      capacity: Number(capacity) || 30,
      deadline: deadline || date,
    });
    onSaved();
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Club">
            <Select value={clubId} onChange={(e) => setClubId(e.target.value)}>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
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
          <Field label="Event image">
            <Input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => onImage(e.target.files?.[0])} />
            {image ? <img src={image} alt="" className="mt-3 h-32 w-52 rounded-xl object-cover" /> : null}
            {imageError ? <p className="mt-1 text-sm text-rose-600">{imageError}</p> : null}
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Description">
            <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button type="submit">{event ? "Update event" : "Create event"}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
