import { FormEvent, useMemo, useState, type ComponentType, type SVGProps } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Ticket,
  Users,
  UserRound,
  Megaphone,
  Building2,
  UserPlus,
  X,
  BarChart3,
  History,
  ClipboardCheck,
  UserCheck,
  Settings,
} from "lucide-react";
import { Logo } from "./Logo";
import { PublicNavbar } from "./PublicNavbar";
import { unreadCount, useStore } from "@/lib/store";

type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
type NavItem = { href: string; label: string; icon: NavIcon };
type NavSection = { id?: string; label?: string; items: NavItem[] };

const studentNav: NavSection[] = [
  {
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/my-clubs", label: "My Clubs", icon: Users },
      { href: "/app/clubs", label: "Browse Clubs", icon: Building2 },
      { href: "/app/events", label: "Events", icon: CalendarDays },
      { href: "/app/registrations", label: "My Registrations", icon: Ticket },
      { href: "/app/history", label: "History", icon: History },
      { href: "/app/notifications", label: "Notification", icon: Bell },
      { href: "/app/profile", label: "Profile", icon: UserRound },
    ],
  },
];

const leaderNav: NavSection[] = [
  {
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/my-clubs", label: "My Clubs", icon: Users },
      { href: "/app/registrations", label: "My Registrations", icon: Ticket },
    ],
  },
  {
    id: "club",
    label: "Club",
    items: [
      { href: "/app/leader/club", label: "Details", icon: Settings },
      { href: "/app/leader/members", label: "Members", icon: UserPlus },
      { href: "/app/leader/requests", label: "Join Requests", icon: ClipboardList },
      { href: "/app/events", label: "Events", icon: CalendarDays },
      { href: "/app/leader/registrations", label: "Registrations", icon: ClipboardCheck },
      { href: "/app/leader/attendance", label: "Attendance", icon: UserCheck },
      { href: "/app/leader/announcements", label: "Announcements", icon: Megaphone },
      { href: "/app/leader/reports", label: "Reports", icon: Flag },
    ],
  },
  {
    items: [
      { href: "/app/notifications", label: "Notification", icon: Bell },
      { href: "/app/profile", label: "Profile", icon: UserRound },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/admin/users", label: "Users", icon: Users },
      { href: "/app/admin/clubs", label: "Clubs", icon: Building2 },
      { href: "/app/admin/requests", label: "Leader Applications", icon: ClipboardList },
      { href: "/app/admin/events", label: "Events", icon: CalendarDays },
      { href: "/app/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/app/admin/reports", label: "Reports", icon: Flag },
      { href: "/app/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/app/notifications", label: "Notification", icon: Bell },
      { href: "/app/profile", label: "Profile", icon: UserRound },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  items,
  pathname,
  unread,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  unread: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`relative z-10 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              active ? "bg-white/10 font-semibold text-white" : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="pointer-events-none h-4 w-4 shrink-0" aria-hidden />
            <span className="pointer-events-none truncate">{item.label}</span>
            {item.href === "/app/notifications" && unread > 0 ? (
              <span className="pointer-events-none ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] text-white">
                {unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

function SidebarNav({
  sections,
  pathname,
  unread,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  unread: number;
  onNavigate?: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        const groupId = section.id ?? `section-${index}`;
        const expanded = section.label ? (openGroups[groupId] ?? true) : true;

        if (!section.label) {
          return (
            <div key={groupId} className="space-y-1">
              <NavLinks items={section.items} pathname={pathname} unread={unread} onNavigate={onNavigate} />
            </div>
          );
        }

        return (
          <div key={groupId} className="pt-2">
            <button
              type="button"
              onClick={() => setOpenGroups((prev) => ({ ...prev, [groupId]: !(prev[groupId] ?? true) }))}
              className="mb-1 flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
            >
              {section.label}
              <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? "rotate-0" : "-rotate-90"}`} />
            </button>
            {expanded ? (
              <div className="space-y-1">
                <NavLinks items={section.items} pathname={pathname} unread={unread} onNavigate={onNavigate} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function AppShell() {
  const { currentUser, logout, notifications } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const unread = currentUser ? unreadCount(notifications, currentUser.id) : 0;

  const sections = useMemo(() => {
    if (!currentUser) return studentNav;
    if (currentUser.role === "admin") return adminNav;
    if (currentUser.role === "leader") return leaderNav;
    return studentNav;
  }, [currentUser]);

  const isGuestBrowse =
    !currentUser &&
    (pathname.startsWith("/app/clubs") || pathname.startsWith("/app/events"));

  if (!currentUser && !isGuestBrowse) {
    return <Navigate to="/login" replace />;
  }

  if (isGuestBrowse) {
    return (
      <>
        <PublicNavbar />
        <main className="min-h-screen bg-page p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="relative z-20 hidden w-[230px] shrink-0 flex-col bg-navy text-slate-300 md:flex">
        <div className="px-5 py-5">
          <Logo light />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <SidebarNav sections={sections} pathname={pathname} unread={unread} />
        </nav>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="m-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="pointer-events-none h-4 w-4 shrink-0" aria-hidden />
          <span className="pointer-events-none">Logout</span>
        </button>
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="relative z-10 flex h-full w-[230px] flex-col bg-navy text-slate-300">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo light />
              <button type="button" onClick={() => setOpen(false)} className="text-white" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3">
              <SidebarNav sections={sections} pathname={pathname} unread={unread} onNavigate={() => setOpen(false)} />
            </nav>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="m-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400"
            >
              <LogOut className="pointer-events-none h-4 w-4 shrink-0" aria-hidden />
              <span className="pointer-events-none">Logout</span>
            </button>
          </aside>
        </div>
      ) : null}
      <div className="relative z-0 flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 md:px-6">
          <button className="rounded-lg p-2 text-slate-600 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <form
            className="relative w-full max-w-md"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const q = query.trim();
              const target = pathname.includes("/events") ? "/app/events" : "/app/clubs";
              navigate(q ? `${target}?q=${encodeURIComponent(q)}` : target);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clubs, events..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand focus:bg-white"
            />
          </form>
          <div className="ml-auto flex items-center gap-3">
            {currentUser.role !== "student" ? (
              <span className="hidden items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-brand sm:inline-flex">
                <Shield className="h-3 w-3" />
                {currentUser.role === "admin" ? "Admin" : "Club Leader"}
              </span>
            ) : null}
            <Link to="/app/notifications" className="relative rounded-full p-2 text-slate-500 hover:bg-slate-50">
              <Bell className="h-5 w-5" />
              {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" /> : null}
            </Link>
            <Link
              to="/app/profile"
              className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-bold text-white"
            >
              {currentUser.avatar}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}