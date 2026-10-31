import { Badge, Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AdminReportsPage() {
  const store = useStore();
  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="Reported content is reviewed by administrators." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Monitor reported content</h1>
      {store.reports.length === 0 ? (
        <Empty title="No reports" body="Flags from students and leaders will appear here." />
      ) : (
        store.reports.map((r) => {
          const reporter = store.users.find((u) => u.id === r.reporterId);
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold capitalize">{r.targetType} report</p>
                  <p className="mt-1 text-sm text-slate-500">{r.reason}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    From {reporter?.name} • {new Date(r.createdAt).toLocaleString()} • target {r.targetId}
                  </p>
                </div>
                {r.status === "open" ? (
                  <Button onClick={() => store.resolveReport(r.id)}>Mark resolved</Button>
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
