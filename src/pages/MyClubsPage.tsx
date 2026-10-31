import { ClubCard } from "@/components/ClubCard";
import { Empty } from "@/components/ui";
import { useStore } from "@/lib/store";

export function MyClubsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const clubs = store.clubs.filter(
    (c) => c.memberIds.includes(user.id) || c.pendingMemberIds.includes(user.id),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900">My Clubs</h1>
      <p className="mb-6 text-sm text-slate-500">Clubs you have joined or requested to join.</p>
      {clubs.length === 0 ? (
        <Empty title="No clubs yet" body="Browse clubs and send a join request to get started." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              joined={club.memberIds.includes(user.id)}
              pending={club.pendingMemberIds.includes(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
