<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\ClubEvent;
use App\Models\LeaderRequest;

class AdminController extends Controller
{
    public function indexLeaderRequests()
    {
        $requests = \App\Models\LeaderRequest::orderByDesc('created_at')->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'userId' => (int) $r->user_id,
                'clubName' => $r->club_name,
                'category' => $r->category,
                'reason' => $r->reason,
                'documentName' => $r->document_name,
                'status' => $r->status,
                'createdAt' => optional($r->created_at)->toISOString(),
                'reviewedAt' => optional($r->reviewed_at)->toISOString(),
            ];
        });

        return response()->json(['requests' => $requests]);
    }

    public function storeReport(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        $targetType = $request->input('targetType', $request->input('target_type'));
        $targetId = $request->input('targetId', $request->input('target_id'));
        $reason = trim((string) $request->input('reason', ''));
        if (! $userId || ! $targetType || ! $targetId || $reason === '') {
            return response()->json(['error' => 'user_id, targetType, targetId and reason are required.'], 400);
        }

        $id = 'r-' . substr(md5(uniqid('', true)), 0, 8);
        Report::create([
            'id' => $id,
            'reporter_id' => $userId,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'reason' => $reason,
            'status' => 'open',
            'created_at' => now(),
        ]);

        foreach (User::where('role', 'admin')->get() as $admin) {
            DB::table('notifications')->insert([
                'id' => 'n-' . substr(md5(uniqid('', true)), 0, 8),
                'user_id' => $admin->id,
                'title' => 'New report',
                'message' => 'A content report was submitted.',
                'is_read' => 0,
                'created_at' => now(),
            ]);
        }

        return response()->json(['ok' => true, 'reportId' => $id]);
    }

    /** List all users for admin management. */
    public function indexUsers()
    {
        $users = User::orderBy('id')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role ?: 'student',
                'phone' => $u->phone ?? '',
                'avatar' => $u->avatar ?? '',
                'memberSince' => optional($u->created_at)->format('M j, Y') ?: ($u->member_since ?? ''),
                'createdAt' => optional($u->created_at)->toISOString(),
                'banned' => (bool) $u->banned,
                'featured' => (bool) $u->featured,
            ];
        });

        return response()->json(['users' => $users]);
    }

    /** Update a user's role / banned status (admin only). */
    public function updateUser(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $patch = [];
        if ($request->has('role')) {
            $patch['role'] = $request->input('role');
        }
        if ($request->has('banned')) {
            $patch['banned'] = filter_var($request->input('banned'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
        }
        if ($request->has('name')) {
            $patch['name'] = $request->input('name');
        }

        $user->update($patch);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?: 'student',
                'phone' => $user->phone ?? '',
                'avatar' => $user->avatar ?? '',
                'memberSince' => optional($user->created_at)->format('M j, Y') ?: ($user->member_since ?? ''),
                'createdAt' => optional($user->created_at)->toISOString(),
                'banned' => (bool) $user->banned,
                'featured' => (bool) $user->featured,
            ],
        ]);
    }

    /** List all clubs for admin management. */
    public function indexClubs()
    {
        $clubs = Club::with('activities')->orderBy('name')->get()->map(function ($club) {
            $memberIds = DB::table('club_members')->where('club_id', $club->id)->pluck('user_id')->toArray();
            $pendingIds = DB::table('membership_requests')
                ->where('club_id', $club->id)->where('status', 'pending')
                ->pluck('user_id')->toArray();

            return [
                'id' => $club->id,
                'name' => $club->name,
                'category' => $club->category,
                'description' => $club->description,
                'tagline' => $club->tagline,
                'image' => $club->image,
                'cover' => $club->cover,
                'leaderId' => $club->leader_id,
                'location' => $club->location,
                'founded' => $club->founded,
                'createdAt' => optional($club->created_at)->toISOString(),
                'meetingTime' => $club->meeting_time,
                'featured' => $club->featured,
                'activities' => $club->activities->pluck('activity')->values(),
                'memberIds' => array_map('intval', $memberIds),
                'pendingMemberIds' => array_map('intval', $pendingIds),
            ];
        });

        return response()->json(['clubs' => $clubs]);
    }

    /** List all reports for admin monitoring. */
    public function indexReports()
    {
        $reports = Report::orderByDesc('created_at')->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'reporterId' => $r->reporter_id,
                'targetType' => $r->target_type,
                'targetId' => $r->target_id,
                'reason' => $r->reason,
                'status' => $r->status,
                'createdAt' => optional($r->created_at)->toISOString(),
            ];
        });

        return response()->json(['reports' => $reports]);
    }

    /** Resolve a report (admin only). */
    public function resolveReport(Request $request, $id)
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['error' => 'Report not found.'], 404);
        }

        $report->status = 'resolved';
        $report->save();

        return response()->json(['ok' => true]);
    }

    /** Delete a club (admin only). Removes members, events, announcements. */
    public function deleteClub($id)
    {
        $club = Club::find($id);
        if (!$club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }

        // Clean up related records.
        DB::table('club_members')->where('club_id', $id)->delete();
        DB::table('membership_requests')->where('club_id', $id)->delete();
        DB::table('announcements')->where('club_id', $id)->delete();

        $eventIds = DB::table('events')->where('club_id', $id)->pluck('id');
        foreach ($eventIds as $eventId) {
            DB::table('event_registrations')->where('event_id', $eventId)->delete();
        }
        DB::table('events')->where('club_id', $id)->delete();

        $club->delete();

        return response()->json(['ok' => true]);
    }

    public function createClub(Request $request)
    {
        $name = trim((string) $request->input('name', ''));
        if ($name === '') {
            return response()->json(['error' => 'Club name is required.'], 400);
        }

        $leaderId = $request->has('leader_id') || $request->has('leaderId')
            ? (int) $request->input('leader_id', $request->input('leaderId'))
            : null;
        if ($leaderId === 0) {
            $leaderId = null;
        }

        $id = $request->input('id') ?: ('c-' . substr(md5(uniqid('', true)), 0, 8));
        $club = Club::create([
            'id' => $id,
            'name' => $name,
            'category' => $request->input('category', 'Arts & Design'),
            'tagline' => $request->input('tagline', ''),
            'description' => $request->input('description', ''),
            'image' => $request->input('image', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80'),
            'cover' => $request->input('cover', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80'),
            'leader_id' => $leaderId,
            'location' => $request->input('location', 'Main Campus'),
            'founded' => $request->input('founded', date('M Y')),
            'meeting_time' => $request->input('meetingTime', $request->input('meeting_time', 'To be announced')),
        ]);

        $this->syncActivities($club->id, $request->input('activities', []));

        if ($leaderId) {
            DB::table('club_members')->insertOrIgnore([
                'club_id' => $club->id,
                'user_id' => $leaderId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $leader = User::find($leaderId);
            if ($leader && $leader->role === 'student') {
                $leader->role = 'leader';
                $leader->save();
            }
        }

        return response()->json(['ok' => true, 'club' => $this->transformClub($club->fresh())]);
    }

    public function updateClub(Request $request, $id)
    {
        $club = Club::find($id);
        if (! $club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }

        $patch = [
            'name' => $request->input('name', $club->name),
            'category' => $request->input('category', $club->category),
            'tagline' => $request->input('tagline', $club->tagline),
            'description' => $request->input('description', $club->description),
            'location' => $request->input('location', $club->location),
            'meeting_time' => $request->input('meetingTime', $request->input('meeting_time', $club->meeting_time)),
        ];

        if ($request->has('leader_id') || $request->has('leaderId')) {
            $patch['leader_id'] = (int) $request->input('leader_id', $request->input('leaderId')) ?: null;
        }

        $club->update($patch);

        if ($request->has('activities')) {
            $this->syncActivities($club->id, $request->input('activities', []));
        }

        return response()->json(['ok' => true, 'club' => $this->transformClub($club->fresh())]);
    }

    public function assignLeader(Request $request, $clubId)
    {
        $leaderId = (int) $request->input('leader_id', $request->input('leaderId', $request->input('user_id')));
        if (! $leaderId) {
            return response()->json(['error' => 'leader_id required.'], 400);
        }

        $club = Club::find($clubId);
        if (! $club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }

        $user = User::find($leaderId);
        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $club->leader_id = $leaderId;
        $club->save();

        if ($user->role !== 'admin') {
            $user->role = 'leader';
            $user->save();
        }

        DB::table('club_members')->insertOrIgnore([
            'club_id' => $clubId,
            'user_id' => $leaderId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function indexEvents()
    {
        $events = ClubEvent::all()->map(function ($event) {
            $registeredIds = DB::table('event_registrations')->where('event_id', $event->id)->pluck('user_id')->toArray();
            $attendedIds = [];
            if (Schema::hasColumn('event_registrations', 'attended')) {
                $attendedIds = DB::table('event_registrations')
                    ->where('event_id', $event->id)
                    ->where('attended', 1)
                    ->pluck('user_id')
                    ->toArray();
            }

            $payload = [
                'id' => $event->id,
                'clubId' => $event->club_id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => optional($event->event_date)->format('Y-m-d'),
                'time' => $event->event_time,
                'location' => $event->location,
                'image' => $event->image,
                'capacity' => $event->capacity,
                'registeredIds' => array_map('intval', $registeredIds),
                'attendedIds' => array_map('intval', $attendedIds),
                'deadline' => optional($event->registration_deadline)->format('Y-m-d'),
            ];

            if (Schema::hasColumn('events', 'status')) {
                $payload['status'] = $event->status ?? null;
            }

            return $payload;
        });

        return response()->json(['events' => $events]);
    }

    public function deleteEvent($id)
    {
        $event = ClubEvent::find($id);
        if (! $event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }

        DB::table('event_registrations')->where('event_id', $id)->delete();
        $event->delete();

        return response()->json(['ok' => true]);
    }

    public function stats()
    {
        $students = User::where(function ($q) {
            $q->where('role', 'student')->orWhereNull('role');
        })->count();
        $leaders = User::where('role', 'leader')->count();
        $admins = User::where('role', 'admin')->count();
        $clubs = Club::count();
        $events = ClubEvent::count();
        $pendingLeaderRequests = LeaderRequest::where('status', 'pending')->count();
        $openReports = Report::where('status', 'open')->count();

        return response()->json([
            'students' => $students,
            'leaders' => $leaders,
            'admins' => $admins,
            'clubs' => $clubs,
            'events' => $events,
            'pendingLeaderRequests' => $pendingLeaderRequests,
            'openReports' => $openReports,
        ]);
    }

    public function indexPlatformAnnouncements()
    {
        if (! Schema::hasTable('platform_announcements')) {
            return response()->json(['announcements' => []]);
        }

        $rows = DB::table('platform_announcements')->orderByDesc('created_at')->get()->map(function ($row) {
            return [
                'id' => $row->id,
                'title' => $row->title,
                'body' => $row->body,
                'createdAt' => $row->created_at ? (string) $row->created_at : null,
                'updatedAt' => isset($row->updated_at) ? (string) $row->updated_at : null,
            ];
        });

        return response()->json(['announcements' => $rows]);
    }

    public function storePlatformAnnouncement(Request $request)
    {
        if (! Schema::hasTable('platform_announcements')) {
            return response()->json(['error' => 'Platform announcements are not available.'], 400);
        }

        $title = trim((string) $request->input('title', ''));
        $body = trim((string) $request->input('body', ''));
        if ($title === '') {
            return response()->json(['error' => 'title is required.'], 400);
        }

        $id = 'pa-' . substr(md5(uniqid('', true)), 0, 8);
        DB::table('platform_announcements')->insert([
            'id' => $id,
            'title' => $title,
            'body' => $body,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true, 'id' => $id]);
    }

    public function destroyPlatformAnnouncement($id)
    {
        if (! Schema::hasTable('platform_announcements')) {
            return response()->json(['error' => 'Platform announcements are not available.'], 400);
        }

        DB::table('platform_announcements')->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    private function syncActivities(string $clubId, $activities): void
    {
        $list = is_array($activities) ? $activities : preg_split('/\r\n|\r|\n/', (string) $activities);
        DB::table('club_activities')->where('club_id', $clubId)->delete();
        foreach ($list as $activity) {
            $activity = trim((string) $activity);
            if ($activity === '') {
                continue;
            }
            DB::table('club_activities')->insert(['club_id' => $clubId, 'activity' => $activity]);
        }
    }

    private function transformClub(Club $club): array
    {
        $club->loadMissing('activities');
        $memberIds = DB::table('club_members')->where('club_id', $club->id)->pluck('user_id')->toArray();
        $pendingIds = DB::table('membership_requests')
            ->where('club_id', $club->id)->where('status', 'pending')
            ->pluck('user_id')->toArray();

        return [
            'id' => $club->id,
            'name' => $club->name,
            'category' => $club->category,
            'description' => $club->description,
            'tagline' => $club->tagline,
            'image' => $club->image,
            'cover' => $club->cover,
            'leaderId' => $club->leader_id,
            'location' => $club->location,
            'founded' => $club->founded,
            'meetingTime' => $club->meeting_time,
            'featured' => $club->featured,
            'activities' => $club->activities->pluck('activity')->values(),
            'memberIds' => array_map('intval', $memberIds),
            'pendingMemberIds' => array_map('intval', $pendingIds),
        ];
    }
}
