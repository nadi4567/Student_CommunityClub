import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClubCard } from "@/components/ClubCard";
import { Empty, Select } from "@/components/ui";
import { CATEGORIES } from "@/lib/seed";
import { useStore } from "@/lib/store";

export function ClubsPage() {
  const store = useStore();
  const user = store.currentUser!;
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("latest");

  const clubs = useMemo(() => {
    let list = store.clubs.filter((c) => {
      const matchesCategory = category === "All Categories" || c.category === category;
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
    if (sort === "members") list = [...list].sort((a, b) => b.memberIds.length - a.memberIds.length);
    else list = [...list].reverse();
    return list;
  }, [store.clubs, category, sort, q]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Clubs</h1>
          <p className="text-sm text-slate-500">Discover and join clubs that match your interests.</p>
        </div>
        <div className="flex gap-3">
          <div className="w-44">
            <p className="mb-1 text-xs text-slate-500">Category</p>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <p className="mb-1 text-xs text-slate-500">Sort by</p>
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="members">Most members</option>
            </Select>
          </div>
        </div>
      </div>
      {clubs.length === 0 ? (
        <Empty title="No clubs found" body="Try a different category or search term." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              joined={club.memberIds.includes(user.id)}
              pending={club.pendingMemberIds.includes(user.id)}
              onJoin={() => store.joinClub(club.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
