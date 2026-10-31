import { useEffect } from "react";
import { Badge, Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function NotificationsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const items = store.notifications.filter((n) => n.userId === user.id);

  useEffect(() => {
    const t = setTimeout(() => store.markNotificationsRead(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <Button variant="ghost" onClick={store.markNotificationsRead}>
          Mark all read
        </Button>
      </div>
      {items.length === 0 ? (
        <Empty title="You're all caught up" body="Approvals, rejections, and club updates will appear here." />
      ) : (
        items.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">{n.title}</p>
                <p className="mt-1 text-sm text-slate-500">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read ? <Badge>New</Badge> : <Badge tone="slate">Read</Badge>}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
