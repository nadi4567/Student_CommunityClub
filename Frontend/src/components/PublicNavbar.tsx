import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";

const links = [
  { href: "/", label: "Home" },
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/#about", label: "About" },
];

export function PublicNavbar() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useStore();

  function openAbout(event: MouseEvent) {
    event.preventDefault();
    if (pathname === "/" && hash === "#about") {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/#about");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-500 md:flex">
          {links.map((l) => {
            const active =
              l.label === "About" ? pathname === "/" && hash === "#about" : pathname === l.href;
            if (l.label === "About") {
              return (
                <a
                  key={l.label}
                  href="/#about"
                  onClick={openAbout}
                  className={active ? "font-medium text-slate-800" : "hover:text-slate-800"}
                >
                  {l.label}
                </a>
              );
            }
            return (
              <Link
                key={l.label}
                to={l.href}
                className={active ? "font-medium text-slate-800" : "hover:text-slate-800"}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <button className="hidden rounded-full p-2 text-slate-400 hover:bg-slate-50 md:block" aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          {currentUser ? (
            <Link
              to="/app/dashboard"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
