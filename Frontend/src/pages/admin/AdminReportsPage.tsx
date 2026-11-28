import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Badge, Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AdminReportsPage() {
  const store = useStore();

  useEffect(() => {
    void store.getAdminReports();
  }, [store]);

  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="Reported content is reviewed by administrators." />;
  }

  function targetInfo(targetType: string, targetId: string) {
    if (targetType === "event") {
      const event = store.events.find((e) => e.id === targetId);
      return {
        label: event?.title ?? targetId,
        href: event ? `/app/events/${event.id}` : null,
      };
    }
    if (targetType === "club") {
      const club = store.clubs.find((c) => c.id === targetId);
      return {
        label: club?.name ?? targetId,
        href: club ? `/app/clubs/${club.id}` : null,
      };
    }
    if (targetType === "announcement") {
      const announcement = store.announcements.find((a) => a.id === targetId);
      const club = store.clubs.find((c) => c.id === announcement?.clubId);
      return {
        label: announcement?.title ?? targetId,
        href: club ? `/app/clubs/${club.id}` : null,
      };
    }
    return { label: targetId, href: null };
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Monitor reported content</h1>
      {store.reports.length === 0 ? (
        <Empty title="No reports" body="Flags from students and leaders will appear here." />
      ) : (
        store.reports.map((r) => {
          const reporter = store.users.find((u) => u.id === r.reporterId);
          const target = targetInfo(r.targetType, r.targetId);
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold capitalize">{r.targetType} report</p>
                  <p className="mt-1 text-sm text-slate-500">{r.reason}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    From {reporter?.name ?? "Unknown"} • {new Date(r.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="capitalize text-slate-500">{r.targetType}: </span>
                    {target.href ? (
                      <Link
                        to={target.href}
                        className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                      >
                        {target.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="font-medium">{target.label}</span>
                    )}
                  </p>
                </div>
                {r.status === "open" ? (
                  <Button onClick={() => void store.resolveAdminReport(r.id)}>Mark resolved</Button>
                ) : (
                  <Badge tone="green">resolved</Badge>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
