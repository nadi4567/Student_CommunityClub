import { Badge, Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AdminUsersPage() {
  const store = useStore();
  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="User management is limited to administrators." />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Manage users</h1>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {store.users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === "admin" ? "rose" : u.role === "leader" ? "violet" : "slate"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.banned ? <Badge tone="rose">banned</Badge> : <Badge tone="green">active</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {u.banned ? (
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => store.updateUser(u.id, { banned: false })}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => store.updateUser(u.id, { banned: true })}
                        disabled={u.id === store.currentUser?.id}
                      >
                        Ban
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
