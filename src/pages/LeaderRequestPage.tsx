import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, Select, TextArea } from "@/components/ui";
import { CATEGORIES } from "@/lib/seed";
import { useStore } from "@/lib/store";

export function LeaderRequestPage() {
  const store = useStore();
  const navigate = useNavigate();
  const user = store.currentUser!;
  const pending = store.leaderRequests.find((r) => r.userId === user.id && r.status === "pending");
  const [clubName, setClubName] = useState("");
  const [category, setCategory] = useState("Arts & Design");
  const [reason, setReason] = useState("");
  const [documentName, setDocumentName] = useState<string>();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    store.submitLeaderRequest({ clubName, category, reason, documentName });
    navigate("/app/profile");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Request Club Leader Role</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fill in the details below to apply for the club leader role. Your request will be reviewed by the admin.
      </p>
      {pending ? (
        <Card className="mt-6 p-6">
          <p className="font-semibold text-slate-800">You already have a pending request</p>
          <p className="mt-1 text-sm text-slate-500">
            {pending.clubName} is waiting for admin review. Check your profile and notifications for status updates.
          </p>
        </Card>
      ) : null}
      <Card className="mt-6 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Club Name">
            <Input required value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Enter club name" />
          </Field>
          <Field label="Club Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Why do you want to be a club leader?">
            <TextArea
              required
              rows={5}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us about your passion and what you plan to do..."
            />
            <p className="mt-1 text-right text-xs text-slate-400">{reason.length}/500</p>
          </Field>
          <Field label="Upload Supporting Document (Optional)">
            <Input type="file" onChange={(e) => setDocumentName(e.target.files?.[0]?.name)} />
            <p className="mt-1 text-xs text-slate-400">{documentName ?? "No file chosen"}</p>
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/app/profile")}>
              Cancel
            </Button>
            <Button type="submit" disabled={Boolean(pending)}>
              Submit Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
