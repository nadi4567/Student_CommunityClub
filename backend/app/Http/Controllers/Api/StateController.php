<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AppNotification;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\LeaderRequest;
use App\Models\MembershipRequest;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StateController extends Controller
{
    public function show()
    {
        $users = User::orderBy('id')->get()->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'password' => '',
            'role' => $u->role ?: 'student',
            'phone' => $u->phone ?? '',
            'avatar' => $u->avatar ?? '',
            'memberSince' => optional($u->created_at)->format('M j, Y') ?: ($u->member_since ?? ''),
            'createdAt' => optional($u->created_at)->toISOString(),
            'banned' => (bool) $u->banned,
            'featured' => (bool) $u->featured,
        ])->values();

        $clubs = Club::with('activities')->get()->map(function (Club $club) {
            $memberIds = DB::table('club_members')->where('club_id', $club->id)->pluck('user_id')->map(fn ($id) => (int) $id)->values();
            $pendingIds = MembershipRequest::where('club_id', $club->id)->where('status', 'pending')->pluck('user_id')->map(fn ($id) => (int) $id)->values();

            return [
                'id' => $club->id,
                'name' => $club->name,
                'category' => $club->category,
                'description' => $club->description,
                'tagline' => $club->tagline,
                'image' => $club->image,
                'cover' => $club->cover,
                'leaderId' => (int) $club->leader_id,
                'location' => $club->location,
                'founded' => $club->founded,
                'createdAt' => optional($club->created_at)->toISOString(),
                'meetingTime' => $club->meeting_time,
                'activities' => $club->activities->pluck('activity')->values(),
                'memberIds' => $memberIds,
                'pendingMemberIds' => $pendingIds,
            ];
        })->values();

        $events = ClubEvent::all()->map(function (ClubEvent $event) {
            $regs = DB::table('event_registrations')->where('event_id', $event->id)->get();
            $registeredIds = $regs->pluck('user_id')->map(fn ($id) => (int) $id)->values();
            $attendedIds = $regs->filter(fn ($r) => (int) ($r->attended ?? 0) === 1)
                ->pluck('user_id')->map(fn ($id) => (int) $id)->values();
            $date = $event->event_date;
            $deadline = $event->registration_deadline;

            return [
                'id' => $event->id,
                'clubId' => $event->club_id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => is_object($date) ? $date->format('Y-m-d') : $date,
                'time' => $event->event_time,
                'location' => $event->location,
                'image' => $event->image,
                'capacity' => (int) $event->capacity,
                'registeredIds' => $registeredIds,
                'attendedIds' => $attendedIds,
                'status' => $event->status ?? 'active',
                'deadline' => is_object($deadline) ? $deadline->format('Y-m-d') : $deadline,
            ];
        })->values();

        $leaderRequests = LeaderRequest::orderByDesc('created_at')->get()->map(fn (LeaderRequest $r) => [
            'id' => $r->id,
            'userId' => (int) $r->user_id,
            'clubName' => $r->club_name,
            'category' => $r->category,
            'reason' => $r->reason,
            'documentName' => $r->document_name,
            'status' => $r->status,
            'createdAt' => optional($r->created_at)->toISOString(),
            'reviewedAt' => optional($r->reviewed_at)->toISOString(),
        ])->values();

        $membershipRequests = MembershipRequest::orderByDesc('created_at')->get()->map(fn (MembershipRequest $r) => [
            'id' => $r->id,
            'clubId' => $r->club_id,
            'userId' => (int) $r->user_id,
            'status' => $r->status,
            'createdAt' => optional($r->created_at)->toISOString(),
        ])->values();

        $announcements = Announcement::orderByDesc('created_at')->get()->map(fn (Announcement $a) => [
            'id' => $a->id,
            'clubId' => $a->club_id,
            'title' => $a->title,
            'body' => $a->body,
            'createdAt' => optional($a->created_at)->toISOString(),
        ])->values();

        $notifications = AppNotification::orderByDesc('created_at')->get()->map(fn (AppNotification $n) => [
            'id' => $n->id,
            'userId' => (int) $n->user_id,
            'title' => $n->title,
            'message' => $n->message,
            'read' => (bool) $n->is_read,
            'createdAt' => optional($n->created_at)->toISOString(),
        ])->values();

        $reports = Report::orderByDesc('created_at')->get()->map(fn (Report $r) => [
            'id' => $r->id,
            'reporterId' => (int) $r->reporter_id,
            'targetType' => $r->target_type,
            'targetId' => $r->target_id,
            'reason' => $r->reason,
            'status' => $r->status,
            'createdAt' => optional($r->created_at)->toISOString(),
        ])->values();

        return response()->json([
            'state' => [
                'users' => $users,
                'clubs' => $clubs,
                'events' => $events,
                'leaderRequests' => $leaderRequests,
                'leaderClubs' => $clubs,
                'membershipRequests' => $membershipRequests,
                'announcements' => $announcements,
                'notifications' => $notifications,
                'reports' => $reports,
                'currentUserId' => null,
            ],
        ]);
    }

    /** Kept for compatibility; entity APIs are the source of truth. */
    public function update()
    {
        return response()->json(['ok' => true, 'message' => 'Use entity APIs; aggregate state is read-only.']);
    }
}
