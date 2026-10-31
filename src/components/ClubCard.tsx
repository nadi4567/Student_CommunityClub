import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import type { Club } from "@/lib/types";
import { Button } from "./ui";

export function ClubCard({
  club,
  onJoin,
  joined,
  pending,
}: {
  club: Club;
  onJoin?: () => void;
  joined?: boolean;
  pending?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <Link to={`/app/clubs/${club.id}`} className="block">
        <div className="relative h-36 overflow-hidden">
          <img src={club.image} alt="" className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand shadow-sm">
            {club.category}
          </span>
        </div>
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-slate-800">{club.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{club.tagline}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between px-4 pb-4">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5" /> {club.memberIds.length} members
        </span>
        {joined ? (
          <span className="text-xs font-semibold text-emerald-600">Joined</span>
        ) : pending ? (
          <span className="text-xs font-semibold text-amber-600">Pending</span>
        ) : (
          <Button className="h-8 px-3 py-0 text-xs" onClick={onJoin}>
            Join Club
          </Button>
        )}
      </div>
    </article>
  );
}
