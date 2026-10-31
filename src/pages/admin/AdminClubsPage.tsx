import { Link } from "react-router-dom";
import { Button, Card, Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function AdminClubsPage() {
  const store = useStore();
  if (store.currentUser?.role !== "admin") {
    return <Empty title="Admins only" body="Club administration is limited to administrators." />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Manage clubs</h1>
      {store.clubs.map((club) => {
        const leader = store.users.find((u) => u.id === club.leaderId);
        return (
          <Card key={club.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <img src={club.image} alt="" className="h-14 w-20 rounded-lg object-cover" />
              <div>
                <p className="font-semibold">{club.name}</p>
                <p className="text-sm text-slate-500">
                  {club.category} • Leader {leader?.name} • {club.memberIds.length} members
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/app/clubs/${club.id}`}>
                <Button variant="secondary">View</Button>
              </Link>
              <Button variant="danger" onClick={() => store.deleteClub(club.id)}>
                Remove
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
