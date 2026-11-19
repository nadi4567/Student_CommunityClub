import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { PublicNavbar } from "@/components/PublicNavbar";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { useStore } from "@/lib/store";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClubsPage } from "@/pages/ClubsPage";
import { ClubDetailPage } from "@/pages/ClubDetailPage";
import { EventsPage } from "@/pages/EventsPage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { MyClubsPage } from "@/pages/MyClubsPage";
import { RegistrationsPage } from "@/pages/RegistrationsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LeaderRequestPage } from "@/pages/LeaderRequestPage";
import { ManageClubPage } from "@/pages/leader/ManageClubPage";
import { MembersPage } from "@/pages/leader/MembersPage";
import { AnnouncementsPage } from "@/pages/leader/AnnouncementsPage";
import { JoinRequestsPage } from "@/pages/leader/JoinRequestsPage";
import { LeaderRegistrationsPage } from "@/pages/leader/RegistrationsPage";
import { AttendancePage } from "@/pages/leader/AttendancePage";
import { LeaderReportsPage } from "@/pages/leader/LeaderReportsPage";
import { AdminRequestsPage } from "@/pages/admin/AdminRequestsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminClubsPage } from "@/pages/admin/AdminClubsPage";
import { AdminReportsPage } from "@/pages/admin/AdminReportsPage";
import { AdminEventsPage } from "@/pages/admin/AdminEventsPage";
import { AdminAnnouncementsPage } from "@/pages/admin/AdminAnnouncementsPage";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";

function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8ff]">
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { currentUser } = useStore();
  if (currentUser) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function RequireRole({
  roles,
  children,
}: {
  roles: Array<"student" | "leader" | "admin">;
  children: ReactNode;
}) {
  const { currentUser } = useStore();
  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/clubs" element={<PublicPage><ClubsPage /></PublicPage>} />
      <Route path="/clubs/:id" element={<PublicPage><ClubDetailPage /></PublicPage>} />
      <Route path="/events" element={<PublicPage><EventsPage /></PublicPage>} />
      <Route path="/events/:id" element={<PublicPage><EventDetailPage /></PublicPage>} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clubs" element={<ClubsPage />} />
        <Route path="clubs/:id" element={<ClubDetailPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="my-clubs" element={<MyClubsPage />} />
        <Route path="registrations" element={<RegistrationsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="leader-request" element={<LeaderRequestPage />} />
        <Route
          path="leader/club"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <ManageClubPage />
            </RequireRole>
          }
        />
        <Route
          path="leader/members"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <MembersPage />
            </RequireRole>
          }
        />
        <Route
          path="leader/requests"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <JoinRequestsPage />
            </RequireRole>
          }
        />
        <Route path="leader/events" element={<Navigate to="/app/events" replace />} />
        <Route
          path="leader/registrations"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <LeaderRegistrationsPage />
            </RequireRole>
          }
        />
        <Route
          path="leader/attendance"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <AttendancePage />
            </RequireRole>
          }
        />
        <Route
          path="leader/announcements"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <AnnouncementsPage />
            </RequireRole>
          }
        />
        <Route
          path="leader/reports"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <LeaderReportsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/requests"
          element={
            <RequireRole roles={["admin"]}>
              <AdminRequestsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireRole roles={["admin"]}>
              <AdminUsersPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/clubs"
          element={
            <RequireRole roles={["admin"]}>
              <AdminClubsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/events"
          element={
            <RequireRole roles={["admin"]}>
              <AdminEventsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/announcements"
          element={
            <RequireRole roles={["admin"]}>
              <AdminAnnouncementsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/reports"
          element={
            <RequireRole roles={["admin"]}>
              <AdminReportsPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/analytics"
          element={
            <RequireRole roles={["admin"]}>
              <AdminAnalyticsPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}