export type Role = "student" | "leader" | "admin";
export type RequestStatus = "pending" | "approved" | "rejected";
export type ReportStatus = "open" | "resolved";

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  avatar: string;
  memberSince: string;
  createdAt?: string;
  banned?: boolean;
  featured?: boolean;
};

export type Club = {
  id: string;
  name: string;
  category: string;
  description: string;
  tagline: string;
  image: string;
  cover: string;
  leaderId: number;
  location: string;
  founded: string;
  createdAt?: string;
  meetingTime: string;
  activities: string[];
  memberIds: number[];
  pendingMemberIds: number[];
  featured?: boolean;
};

export type ClubEvent = {
  id: string;
  clubId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  capacity: number;
  registeredIds: number[];
  attendedIds?: number[];
  status?: string;
  deadline: string;
};

export type PlatformAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string | null;
  updatedAt?: string | null;
};

export type AdminStats = {
  students: number;
  leaders: number;
  admins: number;
  clubs: number;
  events: number;
  pendingLeaderRequests: number;
  openReports: number;
};

export type LeaderDashboardStats = {
  totalMembers: number;
  pendingRequests: number;
  upcomingEvents: number;
  totalRegistrations: number;
};

export type EventRegistrationRow = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  attended: number;
};

export type LeaderRequest = {
  id: string;
  userId: number;
  clubName: string;
  category: string;
  reason: string;
  documentName?: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type MembershipRequest = {
  id: string;
  clubId: string;
  userId: number;
  status: RequestStatus;
  createdAt: string;
};

export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  body: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type Report = {
  id: string;
  reporterId: number;
  targetType: "club" | "event" | "announcement";
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
};

export type AppState = {
  users: User[];
  clubs: Club[];
  events: ClubEvent[];
  leaderRequests: LeaderRequest[];
  leaderClubs?: Club[];
  membershipRequests: MembershipRequest[];
  announcements: Announcement[];
  notifications: AppNotification[];
  reports: Report[];
  currentUserId: number | null;
};
