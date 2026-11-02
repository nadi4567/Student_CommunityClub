import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
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
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LeaderRequestPage } from "@/pages/LeaderRequestPage";
import { ManageClubPage } from "@/pages/leader/ManageClubPage";
import { MembersPage } from "@/pages/leader/MembersPage";
import { LeaderEventsPage } from "@/pages/leader/LeaderEventsPage";
import { AnnouncementsPage } from "@/pages/leader/AnnouncementsPage";
import { AdminRequestsPage } from "@/pages/admin/AdminRequestsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminClubsPage } from "@/pages/admin/AdminClubsPage";
import { AdminReportsPage } from "@/pages/admin/AdminReportsPage";

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
          path="leader/events"
          element={
            <RequireRole roles={["leader", "admin"]}>
              <LeaderEventsPage />
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
          path="admin/reports"
          element={
            <RequireRole roles={["admin"]}>
              <AdminReportsPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
