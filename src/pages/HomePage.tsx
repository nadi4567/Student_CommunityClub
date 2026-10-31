import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Compass, Search, Sparkles, Users } from "lucide-react";
import { HeroArt } from "@/components/HeroArt";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useStore } from "@/lib/store";

export function HomePage() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useStore();

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const clubsPath = q.trim() ? `/app/clubs?q=${encodeURIComponent(q.trim())}` : "/app/clubs";
    if (currentUser) {
      navigate(clubsPath);
      return;
    }
    navigate(`/login?next=${encodeURIComponent(clubsPath)}`);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#ecebff,transparent_40%),linear-gradient(#f7f8ff,#f7f8ff)]">
      <PublicNavbar />
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm font-medium tracking-wide text-brand">Connect • Join • Grow</p>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
            Your Community,
            <br />
            Your Club
          </h1>
          <p className="mt-4 max-w-md text-slate-500">
            Discover clubs, join events, meet new friends, and be part of something bigger.
          </p>
          <form
            onSubmit={onSearch}
            className="mt-8 flex max-w-lg overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-1 items-center gap-2 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for clubs, events, or categories..."
                className="w-full py-3 text-sm outline-none"
              />
            </div>
            <button className="m-1 rounded-full bg-brand px-6 text-sm font-semibold text-white">Search</button>
          </form>
        </div>
        <HeroArt />
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm md:grid-cols-4">
          <Feature icon={Compass} title="Join Clubs" body="Find communities that match your interests." />
          <Feature icon={CalendarDays} title="Attend Events" body="Participate in exciting events and activities." />
          <Feature icon={Users} title="Meet People" body="Make new friends and expand your network." />
          <Feature icon={Sparkles} title="Build Your Future" body="Gain skills, experience, and leadership opportunities." />
        </div>
      </section>
      <section id="about" className="border-t border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">A campus home for every interest</h2>
          <p className="mt-3 text-slate-500">
            Students browse and join clubs, register for events, and apply to lead. Club leaders manage members
            and announcements. Admins review leader requests and keep the community healthy.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Create your account
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Compass;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{body}</p>
      </div>
    </div>
  );
}
