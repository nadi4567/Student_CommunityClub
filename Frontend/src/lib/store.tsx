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
  AdminStats,
  Announcement,
  AppNotification,
  AppState,
  Club,
  ClubEvent,
  EventRegistrationRow,
  LeaderDashboardStats,
  LeaderRequest,
  MembershipRequest,
  PlatformAnnouncement,
  Report,
  Role,
  User,
} from "./types";

const KEY = "scc-app-state-v5";
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

let memory: AppState = initialState;
const listeners = new Set<() => void>();
let leaderRequestEpoch = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function normalizeState(raw: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...raw,
    leaderRequests: raw.leaderRequests ?? [],
    leaderClubs: raw.leaderClubs ?? [],
    users: raw.users ?? [],
    clubs: raw.clubs ?? [],
    events: raw.events ?? [],
    membershipRequests: raw.membershipRequests ?? [],
    announcements: raw.announcements ?? [],
    notifications: raw.notifications ?? [],
    reports: raw.reports ?? [],
    currentUserId: raw.currentUserId ?? null,
  };
}

function persistLocal(state: AppState) {
  memory = state;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  emit();
}

function loadFromStorage() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY) ?? localStorage.getItem("scc-app-state-v4");
  if (!raw) {
    persistLocal(initialState);
    return;
  }
  try {
    memory = normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    persistLocal(initialState);
  }
}

if (typeof window !== "undefined") {
  loadFromStorage();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function mergeRemoteState(remote: AppState, keepUserId: number | null, prev: AppState): AppState {
  return normalizeState({
    ...remote,
    currentUserId: keepUserId,
    leaderClubs: prev.leaderClubs?.length ? prev.leaderClubs : remote.leaderClubs,
  });
}

function mapUser(u: Record<string, unknown>): User {
  return {
    id: Number(u.id),
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    password: String(u.password ?? ""),
    role: (u.role as Role) || "student",
    phone: String(u.phone ?? ""),
    avatar: String(u.avatar ?? ""),
    memberSince: String(u.memberSince ?? u.member_since ?? ""),
    createdAt: u.createdAt != null ? String(u.createdAt) : u.created_at != null ? String(u.created_at) : undefined,
    banned: Boolean(u.banned),
    featured: Boolean(u.featured),
  };
}

function mapClub(c: Record<string, unknown>): Club {
  return {
    id: String(c.id),
    name: String(c.name ?? ""),
    category: String(c.category ?? ""),
    description: String(c.description ?? ""),
    tagline: String(c.tagline ?? ""),
    image: String(c.image ?? ""),
    cover: String(c.cover ?? ""),
    leaderId: Number(c.leaderId ?? c.leader_id ?? 0),
    location: String(c.location ?? ""),
    founded: String(c.founded ?? ""),
    createdAt: c.createdAt != null ? String(c.createdAt) : c.created_at != null ? String(c.created_at) : undefined,
    meetingTime: String(c.meetingTime ?? c.meeting_time ?? ""),
    activities: Array.isArray(c.activities) ? (c.activities as string[]) : [],
    memberIds: Array.isArray(c.memberIds) ? (c.memberIds as number[]).map(Number) : [],
    pendingMemberIds: Array.isArray(c.pendingMemberIds)
      ? (c.pendingMemberIds as number[]).map(Number)
      : [],
    featured: Boolean(c.featured),
  };
}

function mapEvent(e: Record<string, unknown>): ClubEvent {
  return {
    id: String(e.id),
    clubId: String(e.clubId ?? e.club_id ?? ""),
    title: String(e.title ?? ""),
    description: String(e.description ?? ""),
    date: String(e.date ?? ""),
    time: String(e.time ?? e.event_time ?? ""),
    location: String(e.location ?? ""),
    image: String(e.image ?? ""),
    capacity: Number(e.capacity ?? 30),
    registeredIds: Array.isArray(e.registeredIds)
      ? (e.registeredIds as number[]).map(Number)
      : [],
    attendedIds: Array.isArray(e.attendedIds) ? (e.attendedIds as number[]).map(Number) : undefined,
    status: e.status != null ? String(e.status) : undefined,
    deadline: String(e.deadline ?? e.date ?? ""),
  };
}

type StoreValue = AppState & {
  hydrated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<string | null>;
  logout: () => void;
  joinClub: (clubId: string) => Promise<void>;
  cancelJoinRequest: (clubId: string) => Promise<void>;
  reviewMembership: (requestId: string, status: "approved" | "rejected") => Promise<void>;
  removeMember: (clubId: string, userId: number) => Promise<void>;
  registerEvent: (eventId: string) => Promise<void>;
  unregisterEvent: (eventId: string) => Promise<void>;
  submitLeaderRequest: (input: {
    clubName: string;
    category: string;
    reason: string;
    documentName?: string;
  }) => Promise<void>;
  getLeaderRequests: () => Promise<void>;
  getLeaderClubs: () => Promise<void>;
  getAdminLeaderRequests: () => Promise<void>;
  reviewLeaderRequest: (requestId: string, status: "approved" | "rejected") => Promise<string | null>;
  getAdminUsers: () => Promise<void>;
  getAdminClubs: () => Promise<void>;
  getAdminReports: () => Promise<void>;
  getAdminEvents: () => Promise<void>;
  getAdminStats: () => Promise<AdminStats | null>;
  updateAdminUser: (userId: number, patch: { role?: string; banned?: boolean; name?: string }) => Promise<void>;
  deleteAdminClub: (clubId: string) => Promise<void>;
  deleteAdminEvent: (eventId: string) => Promise<void>;
  createAdminClub: (input: Partial<Club> & { leaderId?: number }) => Promise<void>;
  updateAdminClub: (clubId: string, patch: Partial<Club>) => Promise<void>;
  assignLeader: (clubId: string, leaderId: number) => Promise<void>;
  resolveAdminReport: (reportId: string) => Promise<void>;
  getPlatformAnnouncements: () => Promise<PlatformAnnouncement[]>;
  createPlatformAnnouncement: (title: string, body: string) => Promise<void>;
  deletePlatformAnnouncement: (id: string) => Promise<void>;
  refreshState: () => Promise<void>;
  upsertClub: (club: Partial<Club> & { id?: string }) => Promise<string>;
  saveEvent: (event: Partial<ClubEvent> & { clubId: string; id?: string }) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  publishAnnouncement: (clubId: string, title: string, body: string) => Promise<void>;
  updateAnnouncement: (id: string, title: string, body: string) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markAttendance: (eventId: string, studentId: number, attended: boolean) => Promise<void>;
  getLeaderDashboard: () => Promise<LeaderDashboardStats | null>;
  getEventRegistrations: (eventId: string) => Promise<EventRegistrationRow[]>;
  reportContent: (input: Omit<Report, "id" | "status" | "createdAt" | "reporterId">) => Promise<void>;
  resolveReport: (reportId: string) => void;
  markNotificationsRead: () => Promise<void>;
  updateUser: (userId: number, patch: Partial<User>) => Promise<void>;
  setUserRole: (userId: number, role: Role) => void;
  deleteClub: (clubId: string) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, () => memory, () => initialState);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    persistLocal(updater(memory));
  }, []);

  const refreshState = useCallback(async () => {
    const epoch = leaderRequestEpoch;
    try {
      const res = await fetch(`${API_URL}/api/state`);
      const data = await res.json().catch(() => ({}));
      if (data?.state) {
        const keep = memory.currentUserId;
        commit((prev) => {
          const merged = mergeRemoteState(data.state as AppState, keep, prev);
          if (epoch === leaderRequestEpoch) return merged;
          return {
            ...merged,
            leaderRequests: prev.leaderRequests,
            clubs: prev.clubs,
            users: prev.users,
          };
        });
      }
    } catch {
      /* offline */
    }
  }, [commit]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

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
        ...(draft.notifications ?? []),
      ];
    },
    [],
  );

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const afterMutation = useCallback(
    async (ok: boolean) => {
      if (ok) await refreshState();
    },
    [refreshState],
  );

  const value = useMemo<StoreValue>(() => {
    return {
      ...state,
      leaderRequests: state.leaderRequests ?? [],
      leaderClubs: state.leaderClubs ?? [],
      hydrated,
      currentUser,
      refreshState,

      login: async (email, password) => {
        try {
          const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.user && !data?.error) {
            const mapped = mapUser(data.user);
            if (mapped.banned) return "Your account has been banned.";
            commit((prev) => {
              const exists = prev.users.some((x) => x.id === mapped.id);
              return {
                ...prev,
                users: exists
                  ? prev.users.map((x) => (x.id === mapped.id ? { ...x, ...mapped } : x))
                  : [...prev.users, mapped],
                currentUserId: mapped.id,
              };
            });
            await refreshState();
            return null;
          }
          return (data?.error as string) || "Invalid email or password.";
        } catch {
          return "Unable to reach backend. Start Laravel (`php artisan serve`) and MySQL, then try again.";
        }
      },

      register: async (name, email, password, phone = "") => {
        try {
          const res = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ name, email, password, phone }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data?.error) {
            return (data?.error as string) || (data?.message as string) || "Registration failed.";
          }
          if (!data?.user?.id) {
            return "Registration failed: backend did not return a user.";
          }
          const user = mapUser(data.user);
          commit((prev) => ({
            ...prev,
            users: [...prev.users.filter((u) => u.id !== user.id), user],
          }));
          return null;
        } catch {
          return "Unable to reach backend. Start Laravel (`php artisan serve`) and MySQL, then try again.";
        }
      },

      logout: () => commit((prev) => ({ ...prev, currentUserId: null })),

      joinClub: async (clubId) => {
        const user = currentUser;
        if (!user || user.role === "admin") return;
        commit((prev) => {
          const club = prev.clubs.find((c) => c.id === clubId);
          if (
            !club ||
            club.leaderId === user.id ||
            club.memberIds.includes(user.id) ||
            club.pendingMemberIds.includes(user.id)
          ) {
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
              c.id === clubId ? { ...c, pendingMemberIds: [...c.pendingMemberIds, user.id] } : c,
            ),
          };
          notify(next, club.leaderId, "New membership request", `${user.name} requested to join ${club.name}.`);
          return next;
        });
        const res = await fetch(`${API_URL}/api/clubs/${clubId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      cancelJoinRequest: async (clubId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          clubs: prev.clubs.map((c) =>
            c.id === clubId
              ? { ...c, pendingMemberIds: c.pendingMemberIds.filter((id) => id !== user.id) }
              : c,
          ),
          membershipRequests: prev.membershipRequests.filter(
            (r) => !(r.clubId === clubId && r.userId === user.id && r.status === "pending"),
          ),
        }));
        const res = await fetch(`${API_URL}/api/clubs/${clubId}/join?user_id=${user.id}`, {
          method: "DELETE",
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      reviewMembership: async (requestId, status) => {
        const user = currentUser;
        if (!user) return;
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
        const res = await fetch(`${API_URL}/api/membership-requests/${requestId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, status }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      removeMember: async (clubId, memberUserId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          clubs: prev.clubs.map((c) =>
            c.id === clubId ? { ...c, memberIds: c.memberIds.filter((id) => id !== memberUserId) } : c,
          ),
        }));
        const res = await fetch(
          `${API_URL}/api/leader-clubs/${clubId}/members/${memberUserId}?user_id=${user.id}`,
          { method: "DELETE" },
        ).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      registerEvent: async (eventId) => {
        const user = currentUser;
        if (!user || user.role === "admin") return;
        const event = memory.events.find((e) => e.id === eventId);
        const club = event ? memory.clubs.find((c) => c.id === event.clubId) : undefined;
        if (club?.leaderId === user.id) return;
        commit((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId && !e.registeredIds.includes(user.id)
              ? { ...e, registeredIds: [...e.registeredIds, user.id] }
              : e,
          ),
        }));
        const res = await fetch(`${API_URL}/api/events/${eventId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      unregisterEvent: async (eventId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === eventId ? { ...e, registeredIds: e.registeredIds.filter((id) => id !== user.id) } : e,
          ),
        }));
        const res = await fetch(`${API_URL}/api/events/${eventId}/register?user_id=${user.id}`, {
          method: "DELETE",
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      submitLeaderRequest: async (input) => {
        const user = currentUser;
        if (!user) return;
        const res = await fetch(`${API_URL}/api/leader-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            clubName: input.clubName,
            category: input.category,
            reason: input.reason,
            documentName: input.documentName,
          }),
        }).catch(() => null);
        if (!res?.ok) return;
        commit((prev) => {
          if (prev.leaderRequests.some((r) => r.userId === user.id && r.status === "pending")) {
            return prev;
          }
          const request: LeaderRequest = {
            id: uid("lr"),
            userId: user.id,
            ...input,
            status: "pending",
            createdAt: new Date().toISOString(),
          };
          const next = { ...prev, leaderRequests: [request, ...prev.leaderRequests] };
          prev.users
            .filter((u) => u.role === "admin")
            .forEach((admin) =>
              notify(next, admin.id, "Leader request pending", `${user.name} applied to lead ${input.clubName}.`),
            );
          return next;
        });
        await refreshState();
      },

      getLeaderRequests: async () => {
        const user = currentUser;
        if (!user) return;
        try {
          const res = await fetch(`${API_URL}/api/leader-requests/my?user_id=${user.id}`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.requests) {
            commit((prev) => ({
              ...prev,
              leaderRequests: (data.requests as Record<string, unknown>[]).map((r) => ({
                id: String(r.id),
                userId: Number(r.userId),
                clubName: String(r.clubName ?? ""),
                category: String(r.category ?? ""),
                reason: String(r.reason ?? ""),
                documentName: r.documentName != null ? String(r.documentName) : undefined,
                status: r.status as LeaderRequest["status"],
                createdAt: String(r.createdAt ?? ""),
                reviewedAt: r.reviewedAt != null ? String(r.reviewedAt) : undefined,
              })),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      getAdminLeaderRequests: async () => {
        if (currentUser?.role !== "admin") return;
        const epoch = leaderRequestEpoch;
        try {
          const res = await fetch(`${API_URL}/api/admin/leader-requests`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (epoch !== leaderRequestEpoch) return;
          if (res.ok && data?.requests) {
            commit((prev) => ({
              ...prev,
              leaderRequests: (data.requests as Record<string, unknown>[]).map((r) => ({
                id: String(r.id),
                userId: Number(r.userId),
                clubName: String(r.clubName ?? ""),
                category: String(r.category ?? ""),
                reason: String(r.reason ?? ""),
                documentName: r.documentName != null ? String(r.documentName) : undefined,
                status: r.status as LeaderRequest["status"],
                createdAt: String(r.createdAt ?? ""),
                reviewedAt: r.reviewedAt != null ? String(r.reviewedAt) : undefined,
              })),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      getLeaderClubs: async () => {
        const user = currentUser;
        if (!user) return;
        try {
          const res = await fetch(`${API_URL}/api/leader-clubs?user_id=${user.id}`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.clubs) {
            commit((prev) => ({
              ...prev,
              leaderClubs: (data.clubs as Record<string, unknown>[]).map(mapClub),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      reviewLeaderRequest: async (requestId, status) => {
        const user = currentUser;
        if (!user) return "Sign in as an admin before reviewing requests.";
        leaderRequestEpoch += 1;
        try {
          const endpoint =
            user.role === "admin"
              ? `${API_URL}/api/admin/leader-requests/review`
              : `${API_URL}/api/leader-requests/review`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ id: requestId, status, user_id: user.id }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return (data?.error as string) || "Could not update this request.";
          commit((prev) => {
            const next: AppState = {
              ...prev,
              leaderRequests: prev.leaderRequests.map((r) =>
                r.id === requestId ? { ...r, status, reviewedAt: new Date().toISOString() } : r,
              ),
            };
            const request = prev.leaderRequests.find((r) => r.id === requestId);
            if (status === "approved" && data?.clubId && request) {
              const club: Club = {
                id: data.clubId as string,
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
            } else if (request) {
              notify(
                next,
                request.userId,
                "Leader request rejected",
                `Your request to lead ${request.clubName} was not approved.`,
              );
            }
            return next;
          });
          return null;
        } catch {
          return "Could not reach the server. Start Laravel and try again.";
        }
      },

      getAdminUsers: async () => {
        if (currentUser?.role !== "admin") return;
        try {
          const res = await fetch(`${API_URL}/api/admin/users`, { headers: { Accept: "application/json" } });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.users) {
            commit((prev) => ({
              ...prev,
              users: (data.users as Record<string, unknown>[]).map(mapUser),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      getAdminClubs: async () => {
        if (currentUser?.role !== "admin") return;
        try {
          const res = await fetch(`${API_URL}/api/admin/clubs`, { headers: { Accept: "application/json" } });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.clubs) {
            commit((prev) => ({
              ...prev,
              clubs: (data.clubs as Record<string, unknown>[]).map(mapClub),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      getAdminReports: async () => {
        if (currentUser?.role !== "admin") return;
        try {
          const res = await fetch(`${API_URL}/api/admin/reports`, { headers: { Accept: "application/json" } });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.reports) {
            commit((prev) => ({
              ...prev,
              reports: (data.reports as Record<string, unknown>[]).map((r) => ({
                id: String(r.id),
                reporterId: Number(r.reporterId),
                targetType: r.targetType as Report["targetType"],
                targetId: String(r.targetId),
                reason: String(r.reason ?? ""),
                status: r.status as Report["status"],
                createdAt: String(r.createdAt ?? ""),
              })),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      getAdminEvents: async () => {
        if (currentUser?.role !== "admin") return;
        try {
          const res = await fetch(`${API_URL}/api/admin/events`, { headers: { Accept: "application/json" } });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.events) {
            commit((prev) => ({
              ...prev,
              events: (data.events as Record<string, unknown>[]).map(mapEvent),
            }));
          }
        } catch {
          /* ignore */
        }
      },

      getAdminStats: async () => {
        if (currentUser?.role !== "admin") return null;
        try {
          const res = await fetch(`${API_URL}/api/admin/stats`, { headers: { Accept: "application/json" } });
          const data = await res.json().catch(() => ({}));
          if (res.ok) return data as AdminStats;
        } catch {
          /* ignore */
        }
        return null;
      },

      updateAdminUser: async (targetId, patch) => {
        if (currentUser?.role !== "admin") return;
        try {
          const res = await fetch(`${API_URL}/api/admin/users/${targetId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ ...patch, user_id: currentUser.id }),
          });
          if (res.ok) await refreshState();
        } catch {
          /* ignore */
        }
      },

      deleteAdminClub: async (clubId) => {
        if (currentUser?.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/clubs/${clubId}`, {
          method: "DELETE",
          headers: { Accept: "application/json" },
        }).catch(() => null);
        if (res?.ok) {
          commit((prev) => ({
            ...prev,
            clubs: prev.clubs.filter((c) => c.id !== clubId),
            events: prev.events.filter((e) => e.clubId !== clubId),
            announcements: prev.announcements.filter((a) => a.clubId !== clubId),
          }));
          await refreshState();
        }
      },

      deleteAdminEvent: async (eventId) => {
        if (currentUser?.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/events/${eventId}`, {
          method: "DELETE",
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      createAdminClub: async (input) => {
        if (currentUser?.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/clubs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.id,
            ...input,
            leaderId: input.leaderId,
          }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      updateAdminClub: async (clubId, patch) => {
        if (currentUser?.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/clubs/${clubId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: currentUser.id, ...patch }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      assignLeader: async (clubId, leaderId) => {
        if (currentUser?.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/clubs/${clubId}/assign-leader`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: currentUser.id, leader_id: leaderId, leaderId }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      resolveAdminReport: async (reportId) => {
        if (currentUser?.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
          method: "PUT",
          headers: { Accept: "application/json" },
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      getPlatformAnnouncements: async () => {
        try {
          const res = await fetch(`${API_URL}/api/admin/platform-announcements`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.announcements) {
            return (data.announcements as Record<string, unknown>[]).map((a) => ({
              id: String(a.id),
              title: String(a.title ?? ""),
              body: String(a.body ?? ""),
              createdAt: a.createdAt != null ? String(a.createdAt) : null,
              updatedAt: a.updatedAt != null ? String(a.updatedAt) : undefined,
            }));
          }
        } catch {
          /* ignore */
        }
        return [];
      },

      createPlatformAnnouncement: async (title, body) => {
        const user = currentUser;
        if (!user || user.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/platform-announcements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, title, body }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      deletePlatformAnnouncement: async (id) => {
        const user = currentUser;
        if (!user || user.role !== "admin") return;
        const res = await fetch(`${API_URL}/api/admin/platform-announcements/${id}`, {
          method: "DELETE",
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      upsertClub: async (club) => {
        const user = currentUser;
        const leaderId = user?.id ?? memory.currentUserId ?? 0;
        const payload = {
          user_id: leaderId,
          name: club.name,
          category: club.category,
          tagline: club.tagline,
          description: club.description,
          location: club.location,
          meetingTime: club.meetingTime,
          activities: club.activities,
          image: club.image,
        };

        if (club.id) {
          commit((prev) => ({
            ...prev,
            clubs: prev.clubs.map((c) => (c.id === club.id ? { ...c, ...club } : c)),
          }));
          const res = await fetch(`${API_URL}/api/clubs/${club.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).catch(() => null);
          await afterMutation(Boolean(res?.ok));
          return club.id;
        }

        const localId = uid("c");
        commit((prev) => {
          const users =
            user?.role === "student"
              ? prev.users.map((u) => (u.id === leaderId ? { ...u, role: "leader" as const } : u))
              : prev.users;
          const created: Club = {
            id: localId,
            name: club.name ?? "Untitled Club",
            category: club.category ?? "Arts & Design",
            tagline: club.tagline ?? "",
            description: club.description ?? "",
            image: club.image ?? "",
            cover: club.image ?? club.cover ?? "",
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

        const res = await fetch(`${API_URL}/api/clubs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => null);
        const data = await res?.json().catch(() => ({}));
        const id = (data?.club?.id as string) || localId;
        await afterMutation(Boolean(res?.ok));
        return id;
      },

      saveEvent: async (event) => {
        const user = currentUser;
        if (!user) return;
        const body = {
          user_id: user.id,
          clubId: event.clubId,
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          capacity: event.capacity,
          deadline: event.deadline,
          image: event.image,
        };

        if (event.id) {
          commit((prev) => ({
            ...prev,
            events: prev.events.map((e) => (e.id === event.id ? { ...e, ...event } : e)),
          }));
          const res = await fetch(`${API_URL}/api/leader-events/${event.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).catch(() => null);
          await afterMutation(Boolean(res?.ok));
          return;
        }

        const localId = uid("e");
        commit((prev) => {
          const created: ClubEvent = {
            id: localId,
            clubId: event.clubId,
            title: event.title ?? "Untitled event",
            description: event.description ?? "",
            date: event.date ?? "",
            time: event.time ?? "",
            location: event.location ?? "",
            image: event.image ?? "",
            capacity: event.capacity ?? 30,
            registeredIds: [],
            deadline: event.deadline ?? event.date ?? "",
          };
          return { ...prev, events: [created, ...prev.events] };
        });

        const res = await fetch(`${API_URL}/api/leader-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      deleteEvent: async (eventId) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== eventId) }));
        const res = await fetch(`${API_URL}/api/leader-events/${eventId}?user_id=${user.id}`, {
          method: "DELETE",
        }).catch(() => null);
        if (!res?.ok) {
          const fallback = await fetch(`${API_URL}/api/events/${eventId}?user_id=${user.id}`, {
            method: "DELETE",
          }).catch(() => null);
          await afterMutation(Boolean(fallback?.ok));
          return;
        }
        await afterMutation(true);
      },

      publishAnnouncement: async (clubId, title, bodyText) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => {
          const item: Announcement = {
            id: uid("a"),
            clubId,
            title,
            body: bodyText,
            createdAt: new Date().toISOString(),
          };
          const club = prev.clubs.find((c) => c.id === clubId);
          const next = { ...prev, announcements: [item, ...prev.announcements] };
          club?.memberIds.forEach((memberId) =>
            notify(next, memberId, `${club.name} announcement`, title),
          );
          return next;
        });
        const res = await fetch(`${API_URL}/api/leader-clubs/${clubId}/announcements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, title, body: bodyText }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      updateAnnouncement: async (id, title, bodyText) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          announcements: prev.announcements.map((a) => (a.id === id ? { ...a, title, body: bodyText } : a)),
        }));
        const res = await fetch(`${API_URL}/api/announcements/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, title, body: bodyText }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      deleteAnnouncement: async (id) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          announcements: prev.announcements.filter((a) => a.id !== id),
        }));
        const res = await fetch(`${API_URL}/api/announcements/${id}?user_id=${user.id}`, {
          method: "DELETE",
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      markAttendance: async (eventId, studentId, attended) => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          events: prev.events.map((e) => {
            if (e.id !== eventId) return e;
            const attendedIds = new Set(e.attendedIds ?? []);
            if (attended) attendedIds.add(studentId);
            else attendedIds.delete(studentId);
            return { ...e, attendedIds: [...attendedIds] };
          }),
        }));
        const res = await fetch(`${API_URL}/api/leader-events/${eventId}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, student_id: studentId, attended }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      getLeaderDashboard: async () => {
        const user = currentUser;
        if (!user) return null;
        try {
          const res = await fetch(`${API_URL}/api/leader/dashboard?user_id=${user.id}`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) return data as LeaderDashboardStats;
        } catch {
          /* ignore */
        }
        return null;
      },

      getEventRegistrations: async (eventId) => {
        const user = currentUser;
        if (!user) return [];
        try {
          const res = await fetch(`${API_URL}/api/leader-events/${eventId}/registrations?user_id=${user.id}`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.registrations) {
            return (data.registrations as Record<string, unknown>[]).map((r) => ({
              id: Number(r.id),
              name: String(r.name ?? ""),
              email: String(r.email ?? ""),
              avatar: String(r.avatar ?? ""),
              attended: Number(r.attended ?? 0),
            }));
          }
        } catch {
          /* ignore */
        }
        return [];
      },

      reportContent: async (input) => {
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
        const res = await fetch(`${API_URL}/api/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            targetType: input.targetType,
            targetId: input.targetId,
            reason: input.reason,
          }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      resolveReport: (reportId) => {
        commit((prev) => ({
          ...prev,
          reports: prev.reports.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)),
        }));
      },

      markNotificationsRead: async () => {
        const user = currentUser;
        if (!user) return;
        commit((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.userId === user.id ? { ...n, read: true } : n,
          ),
        }));
        const res = await fetch(`${API_URL}/api/notifications/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        }).catch(() => null);
        await afterMutation(Boolean(res?.ok));
      },

      updateUser: async (targetUserId, patch) => {
        const user = currentUser;
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === targetUserId ? { ...u, ...patch } : u)),
        }));
        if (!user) return;
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: targetUserId, ...patch }),
        }).catch(() => null);
        if (res?.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.user) {
            const mapped = mapUser(data.user);
            commit((prev) => ({
              ...prev,
              users: prev.users.map((u) => (u.id === mapped.id ? { ...u, ...mapped } : u)),
            }));
          }
          await refreshState();
        }
      },

      setUserRole: (targetUserId, role) => {
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === targetUserId ? { ...u, role } : u)),
        }));
      },

      deleteClub: (clubId) => {
        commit((prev) => ({
          ...prev,
          clubs: prev.clubs.filter((c) => c.id !== clubId),
          events: prev.events.filter((e) => e.clubId !== clubId),
        }));
      },

      resetDemo: () => persistLocal({ ...initialState, currentUserId: null }),
    };
  }, [afterMutation, commit, currentUser, hydrated, notify, refreshState, state]);

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