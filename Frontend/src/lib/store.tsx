import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { initialState } from "./seed";
import type {
  Announcement,
  AppNotification,
  AppState,
  Club,
  ClubEvent,
  LeaderRequest,
  MembershipRequest,
  Report,
  Role,
  User,
} from "./types";

const KEY = "scc-app-state-v4";
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

let memory: AppState = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(state: AppState) {
  memory = state;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
    fetch(`${API_URL}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    }).catch(() => {});
  }
  emit();
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    persist(initialState);
    return;
  }
  try {
    memory = JSON.parse(raw) as AppState;
  } catch {
    persist(initialState);
  }
}

if (typeof window !== "undefined") {
  loadFromStorage();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type StoreValue = AppState & {
  hydrated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<string | null>;
  logout: () => void;
  joinClub: (clubId: string) => void;
  reviewMembership: (requestId: string, status: "approved" | "rejected") => void;
  removeMember: (clubId: string, userId: number) => void;
  registerEvent: (eventId: string) => void;
  unregisterEvent: (eventId: string) => void;
  submitLeaderRequest: (input: {
    clubName: string;
    category: string;
    reason: string;
    documentName?: string;
  }) => void;
  reviewLeaderRequest: (requestId: string, status: "approved" | "rejected") => void;
  upsertClub: (club: Partial<Club> & { id?: string }) => string;
  saveEvent: (event: Partial<ClubEvent> & { clubId: string; id?: string }) => void;
  deleteEvent: (eventId: string) => void;
  publishAnnouncement: (clubId: string, title: string, body: string) => void;
  reportContent: (input: Omit<Report, "id" | "status" | "createdAt" | "reporterId">) => void;
  resolveReport: (reportId: string) => void;
  markNotificationsRead: () => void;
  updateUser: (userId: number, patch: Partial<User>) => void;
  setUserRole: (userId: number, role: Role) => void;
  deleteClub: (clubId: string) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, () => memory, () => initialState);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/state`);
        const data = await res.json();
        if (data?.state) {
          memory = data.state as AppState;
          emit();
        } else {
          await fetch(`${API_URL}/api/state`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: memory }),
          }).catch(() => {});
        }
      } catch {
      }
    })();
  }, []);

  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    persist(updater(memory));
  }, []);

  const notify = useCallback(
    (draft: AppState, userId: number, title: string, message: string) => {
      draft.notifications = [
        {
          id: uid("n"),
          userId,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...draft.notifications,
      ];
    },
    [],
  );

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const value = useMemo<StoreValue>(() => {
    return {
      ...state,
      hydrated,
      currentUser,
      login: async (email, password) => {
        try {
          const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (res.ok && !data?.error) {
            const u = data.user;
            const mapped: User = {
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role,
              phone: u.phone ?? "",
              avatar: u.avatar ?? "",
              memberSince: u.memberSince ?? "",
              banned: u.banned ?? false,
              featured: u.featured ?? false,
            };
            if (mapped.banned) {
              return "Your account has been banned.";
            }
            commit((prev) => {
              const exists = prev.users.some((x) => x.id === mapped.id);
              return {
                ...prev,
                users: exists ? prev.users : [...prev.users, mapped],
                currentUserId: mapped.id,
              };
            });
            return null;
          }
          return data?.error || "Invalid email or password.";
        } catch {
          const user = state.users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
          );
          if (!user) return "Invalid email or password.";
          if (user.banned) return "Your account has been banned.";
          commit((prev) => ({ ...prev, currentUserId: user.id }));
          return null;
        }
      },
      register: async (name, email, password, phone = "") => {
        if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return "An account with that email already exists.";
        }
        try {
          const res = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, phone }),
          });
          const data = await res.json();
          if (!res.ok || data?.error) {
            return data?.error || "Registration failed.";
          }
          const u = data.user;
          const user: User = {
            id: u.id,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            phone: u.phone ?? "",
            avatar: u.avatar ?? "",
            memberSince: u.memberSince ?? new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
          };
          commit((prev) => ({
            ...prev,
            users: [...prev.users, user],
            currentUserId: user.id,
          }));
          return null;
         } catch {
          return "Unable to reach backend. Is the PHP server running?";
        }
      },
      logout: () => commit((prev) => ({ ...prev, currentUserId: null })),
      joinClub: (clubId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => {
          const club = prev.clubs.find((c) => c.id === clubId);
          if (!club || club.memberIds.includes(user.id) || club.pendingMemberIds.includes(user.id)) {
            return prev;
          }
          const request: MembershipRequest = {
            id: uid("mr"),
            clubId,
            userId: user.id,
            status: "pending",
            createdAt: new Date().toISOString(),
          };
          const next = {
            ...prev,
            membershipRequests: [request, ...prev.membershipRequests],
            clubs: prev.clubs.map((c) =>
              c.id === clubId
                ? { ...c, pendingMemberIds: [...c.pendingMemberIds, user.id] }
                : c,
            ),
            notifications: prev.notifications,
          };
          notify(next, club.leaderId, "New membership request", `${user.name} requested to join ${club.name}.`);
          return next;
        });
      },
      reviewMembership: (requestId, status) => {
        commit((prev) => {
          const request = prev.membershipRequests.find((r) => r.id === requestId);
          if (!request) return prev;
          const club = prev.clubs.find((c) => c.id === request.clubId);
          const next = {
            ...prev,
            membershipRequests: prev.membershipRequests.map((r) =>
              r.id === requestId ? { ...r, status } : r,
            ),
            clubs: prev.clubs.map((c) => {
              if (c.id !== request.clubId) return c;
              const pendingMemberIds = c.pendingMemberIds.filter((id) => id !== request.userId);
              const memberIds =
                status === "approved" && !c.memberIds.includes(request.userId)
                  ? [...c.memberIds, request.userId]
                  : c.memberIds;
              return { ...c, pendingMemberIds, memberIds };
            }),
          };
          const clubName = club?.name ?? "the club";
          notify(
            next,
            request.userId,
            status === "approved" ? "Membership approved" : "Membership declined",
            status === "approved"
              ? `You are now a member of ${clubName}.`
              : `Your request to join ${clubName} was declined.`,
          );
          return next;
        });
      },
      removeMember: (clubId, userId) => {
        commit((prev) => ({
          ...prev,
          clubs: prev.clubs.map((c) =>
            c.id === clubId ? { ...c, memberIds: c.memberIds.filter((id) => id !== userId) } : c,
          ),
        }));
      },
      registerEvent: (eventId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId && !e.registeredIds.includes(user.id)
              ? { ...e, registeredIds: [...e.registeredIds, user.id] }
              : e,
          ),
        }));
      },
      unregisterEvent: (eventId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId
              ? { ...e, registeredIds: e.registeredIds.filter((id) => id !== user.id) }
              : e,
          ),
        }));
      },
      submitLeaderRequest: (input) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => {
          const request: LeaderRequest = {
            id: uid("lr"),
            userId: user.id,
            ...input,
            status: "pending",
            createdAt: new Date().toISOString(),
          };
          if (
            prev.leaderRequests.some((r) => r.userId === user.id && r.status === "pending")
          ) {
            return prev;
          }
          const next = {
            ...prev,
            leaderRequests: [request, ...prev.leaderRequests],
          };
          const admins = prev.users.filter((u) => u.role === "admin");
          admins.forEach((admin) =>
            notify(next, admin.id, "Leader request pending", `${user.name} applied to lead ${input.clubName}.`),
          );
          return next;
        });
      },
      reviewLeaderRequest: (requestId, status) => {
        commit((prev) => {
          const request = prev.leaderRequests.find((r) => r.id === requestId);
          if (!request) return prev;
          const next: AppState = {
            ...prev,
            leaderRequests: prev.leaderRequests.map((r) =>
              r.id === requestId
                ? { ...r, status, reviewedAt: new Date().toISOString() }
                : r,
            ),
          };
          if (status === "approved") {
            const clubId = uid("c");
            const club: Club = {
              id: clubId,
              name: request.clubName,
              category: request.category,
              tagline: "A new community on campus.",
              description: request.reason,
              image:
                "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
              cover:
                "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80",
              leaderId: request.userId,
              location: "Main Campus",
              founded: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
              meetingTime: "To be announced",
              activities: [],
              memberIds: [request.userId],
              pendingMemberIds: [],
            };
            next.clubs = [club, ...next.clubs];
            next.users = next.users.map((u) =>
              u.id === request.userId ? { ...u, role: "leader" } : u,
            );
            notify(
              next,
              request.userId,
              "Leader request approved",
              `You are now the club leader of ${request.clubName}.`,
            );
          } else {
            notify(
              next,
              request.userId,
              "Leader request rejected",
              `Your request to lead ${request.clubName} was not approved.`,
            );
          }
          return next;
        });
      },
      upsertClub: (club) => {
        const id = club.id ?? uid("c");
        commit((prev) => {
          if (club.id) {
            return {
              ...prev,
              clubs: prev.clubs.map((c) => (c.id === club.id ? { ...c, ...club } : c)),
            };
          }
          const leaderId = currentUser?.id ?? prev.currentUserId ?? 0;
          const users =
            currentUser?.role === "student"
              ? prev.users.map((u) => (u.id === leaderId ? { ...u, role: "leader" as const } : u))
              : prev.users;
          const created: Club = {
            id,
            name: club.name ?? "Untitled Club",
            category: club.category ?? "Arts & Design",
            tagline: club.tagline ?? "",
            description: club.description ?? "",
            image:
              club.image ??
              "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
            cover:
              club.cover ??
              "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80",
            leaderId,
            location: club.location ?? "Main Campus",
            founded:
              club.founded ??
              new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
            meetingTime: club.meetingTime ?? "To be announced",
            activities: club.activities ?? [],
            memberIds: [leaderId],
            pendingMemberIds: [],
          };
          return { ...prev, users, clubs: [created, ...prev.clubs] };
        });
        return id;
      },
      saveEvent: (event) => {
        commit((prev) => {
          if (event.id) {
            return {
              ...prev,
              events: prev.events.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
            };
          }
          const created: ClubEvent = {
            id: uid("e"),
            clubId: event.clubId,
            title: event.title ?? "Untitled event",
            description: event.description ?? "",
            date: event.date ?? "",
            time: event.time ?? "",
            location: event.location ?? "",
            image:
              event.image ??
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
            capacity: event.capacity ?? 30,
            registeredIds: [],
            deadline: event.deadline ?? event.date ?? "",
          };
          return { ...prev, events: [created, ...prev.events] };
        });
      },
      deleteEvent: (eventId) => {
        commit((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== eventId) }));
      },
      publishAnnouncement: (clubId, title, body) => {
        commit((prev) => {
          const item: Announcement = {
            id: uid("a"),
            clubId,
            title,
            body,
            createdAt: new Date().toISOString(),
          };
          const club = prev.clubs.find((c) => c.id === clubId);
          const next = { ...prev, announcements: [item, ...prev.announcements] };
          club?.memberIds.forEach((memberId) =>
            notify(next, memberId, `${club.name} announcement`, title),
          );
          return next;
        });
      },
      reportContent: (input) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => {
          const report: Report = {
            id: uid("r"),
            reporterId: user.id,
            ...input,
            status: "open",
            createdAt: new Date().toISOString(),
          };
          const next = { ...prev, reports: [report, ...prev.reports] };
          prev.users
            .filter((u) => u.role === "admin")
            .forEach((admin) =>
              notify(next, admin.id, "New report", `${user.name} submitted a content report.`),
            );
          return next;
        });
      },
      resolveReport: (reportId) => {
        commit((prev) => ({
          ...prev,
          reports: prev.reports.map((r) =>
            r.id === reportId ? { ...r, status: "resolved" } : r,
          ),
        }));
      },
      markNotificationsRead: () => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.userId === user.id ? { ...n, read: true } : n,
          ),
        }));
      },
      updateUser: (userId, patch) => {
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
        }));
      },
      setUserRole: (userId, role) => {
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
        }));
      },
      deleteClub: (clubId) => {
        commit((prev) => ({
          ...prev,
          clubs: prev.clubs.filter((c) => c.id !== clubId),
          events: prev.events.filter((e) => e.clubId !== clubId),
        }));
      },
      resetDemo: () => persist({ ...initialState, currentUserId: null }),
    };
  }, [commit, currentUser, hydrated, notify, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function unreadCount(notifications: AppNotification[], userId: number) {
  return notifications.filter((n) => n.userId === userId && !n.read).length;
}
