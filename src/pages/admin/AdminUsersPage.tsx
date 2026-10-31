import { Badge, Card, Empty, Select } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

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
              <th className="px-4 py-3">Since</th>
            </tr>
          </thead>
          <tbody>
            {store.users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={u.role === "admin" ? "rose" : u.role === "leader" ? "violet" : "slate"}>
                      {u.role}
                    </Badge>
                    <Select
                      className="w-32 py-1"
                      value={u.role}
                      onChange={(e) => store.setUserRole(u.id, e.target.value as Role)}
                    >
                      <option value="student">student</option>
                      <option value="leader">leader</option>
                      <option value="admin">admin</option>
                    </Select>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.memberSince}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
