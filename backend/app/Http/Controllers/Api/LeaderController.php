<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\LeaderRequest;
use App\Models\MembershipRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class LeaderController extends Controller
{
    /**
     * Fetch the authenticated user's OWN leader requests (student leader role).
     */
    public function myRequests(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $requests = LeaderRequest::where('user_id', $userId)->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'userId' => $r->user_id,
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

    /**
     * Review a leader request (admin or club leader). On approval:
     *  - creates a club owned by the applicant,
     *  - promotes the applicant to role "leader",
     *  - records reviewed_at,
     *  - notifies the applicant.
     */
    public function reviewRequest(Request $request)
    {
        $id = $request->input('id');
        $status = $request->input('status');

        if (!$id || !in_array($status, ['approved', 'rejected'], true)) {
            return response()->json(['error' => 'id and status (approved|rejected) are required.'], 400);
        }

        $requestModel = LeaderRequest::find($id);
        if (!$requestModel) {
            return response()->json(['error' => 'Leader request not found.'], 404);
        }

        $userId = (int) $requestModel->user_id;
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['error' => 'Applicant not found.'], 404);
        }

        $clubId = null;
        $requestModel->status = $status;
        $requestModel->reviewed_at = now();

        if ($status === 'approved') {
            DB::transaction(function () use ($requestModel, $userId, $user, &$clubId) {
                $clubId = 'c-' . substr(md5(uniqid('', true)), 0, 8);
                Club::create([
                    'id' => $clubId,
                    'name' => $requestModel->club_name,
                    'category' => $requestModel->category,
                    'description' => $requestModel->reason,
                    'tagline' => 'A new community on campus.',
                    'image' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
                    'cover' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80',
                    'leader_id' => $userId,
                    'location' => 'Main Campus',
                    'founded' => date('M Y'),
                    'meeting_time' => 'To be announced',
                ]);

                DB::table('club_members')->insertOrIgnore([
                    'club_id' => $clubId,
                    'user_id' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $user->role = 'leader';
                $user->save();
                $requestModel->save();
            });

            DB::table('notifications')->insert([
                'id' => 'n-' . substr(md5(uniqid('', true)), 0, 8),
                'user_id' => $userId,
                'title' => 'Leader request approved',
                'message' => "You are now the club leader of {$requestModel->club_name}.",
                'is_read' => 0,
                'created_at' => now(),
            ]);

            return response()->json(['ok' => true, 'clubId' => $clubId]);
        }

        $requestModel->save();

        DB::table('notifications')->insert([
            'id' => 'n-' . substr(md5(uniqid()), 0, 8),
            'user_id' => $userId,
            'title' => 'Leader request rejected',
            'message' => "Your request to lead {$requestModel->club_name} was not approved.",
            'is_read' => 0,
            'created_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Fetch clubs where the current user is the leader.
     */
    public function myClubs(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubs = Club::where('leader_id', $userId)
            ->with('activities')
            ->get()
            ->map(function ($club) {
                return $this->transform($club);
            });

        return response()->json(['clubs' => $clubs]);
    }

    /**
     * List current members of a club owned by a leader.
     */
    public function clubMembers(Request $request, $clubId)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $club = Club::find($clubId);
        if (!$club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }

        // Only the leader (or admin) may view members.
        if ($club->leader_id !== $userId && !
            (auth()->check() && auth()->id() && User::find(auth()->id()) && User::find(auth()->id())->role === 'admin')) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $members = DB::table('club_members')
            ->where('club_id', $clubId)
            ->pluck('user_id')
            ->map(function ($id) {
                return (int) $id;
            })->toArray();

        $users = User::whereIn('id', $members)->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->avatar,
                'role' => $u->role,
            ];
        });

        return response()->json(['members' => $users]);
    }

    /**
     * Approve or reject a membership request (club leader action).
     */
    public function reviewMembership(Request $request, $clubId, $userId)
    {
        $status = $request->input('status');

        if (!in_array($status, ['approved', 'rejected'], true)) {
            return response()->json(['error' => 'status (approved|rejected) is required.'], 400);
        }

        $member = MembershipRequest::where('club_id', $clubId)
            ->where('user_id', (int) $userId)
            ->first();

        if (!$member) {
            return response()->json(['error' => 'Membership request not found.'], 404);
        }

        $leaderId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$leaderId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $club = Club::find($clubId);
        if (!$club || (int) $club->leader_id !== $leaderId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $member->status = $status;
        $member->save();

        if ($status === 'approved') {
            DB::table('club_members')->insertOrIgnore([
                'club_id' => $clubId,
                'user_id' => (int) $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('notifications')->insert([
                'id' => 'n-' . substr(md5(uniqid()), 0, 8),
                'user_id' => (int) $userId,
                'title' => 'Membership approved',
                'message' => "Your request to join {$club->name} was approved.",
                'is_read' => 0,
                'created_at' => now(),
            ]);
        } else {
            DB::table('notifications')->insert([
                'id' => 'n-' . substr(md5(uniqid()), 0, 8),
                'user_id' => (int) $userId,
                'title' => 'Membership rejected',
                'message' => "Your request to join {$club->name} was not approved.",
                'is_read' => 0,
                'created_at' => now(),
            ]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Create an event for a club the user leads.
     */
    public function createEvent(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubId = $request->input('clubId');
        $title = trim((string) $request->input('title', ''));
        $description = trim((string) $request->input('description', ''));
        $date = $request->input('date');
        $time = trim((string) $request->input('time', ''));
        $location = trim((string) $request->input('location', ''));
        $capacity = (int) $request->input('capacity', 30);
        $deadline = $request->input('deadline');

        if (!$clubId || $title === '' || !$date) {
            return response()->json(['error' => 'clubId, title and date are required.'], 400);
        }

        $club = Club::find($clubId);
        if (!$club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $image = $this->storedImage($request->input('image'), $request);
        if (! $image) {
            return response()->json(['error' => 'Please upload an event image.'], 422);
        }

        $eventId = 'e-' . substr(md5(uniqid()), 0, 8);
        $event = ClubEvent::create([
            'id' => $eventId,
            'club_id' => $clubId,
            'title' => $title,
            'description' => $description,
            'event_date' => $date,
            'event_time' => $time,
            'location' => $location,
            'image' => $image,
            'capacity' => $capacity,
            'registration_deadline' => $deadline ?? $date,
        ]);

        return response()->json(['ok' => true, 'eventId' => $eventId]);
    }

    /**
     * Update an existing event owned by the club's leader.
     */
    public function updateEvent(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubId = $request->input('clubId');
        $title = trim((string) $request->input('title', ''));
        $description = trim((string) $request->input('description', ''));
        $date = $request->input('date');
        $time = trim((string) $request->input('time', ''));
        $location = trim((string) $request->input('location', ''));
        $capacity = (int) $request->input('capacity', 30);
        $deadline = $request->input('deadline');

        $event = ClubEvent::find($id);
        if (!$event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }

        $club = Club::find($clubId);
        if (!$club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $updates = [
            'title' => $title,
            'description' => $description,
            'event_date' => $date,
            'event_time' => $time,
            'location' => $location,
            'capacity' => $capacity,
            'registration_deadline' => $deadline ?? $date,
        ];
        $image = $this->storedImage($request->input('image'), $request);
        if ($image) {
            $updates['image'] = $image;
        }
        $event->update($updates);

        return response()->json(['ok' => true]);
    }

    /**
     * Publish an announcement for a club the user leads.
     */
    public function publishAnnouncement(Request $request, $clubId = null)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubId = $clubId ?: $request->input('clubId');
        $title = trim((string) $request->input('title', ''));
        $body = trim((string) $request->input('body', ''));

        if (!$clubId || $title === '' || $body === '') {
            return response()->json(['error' => 'clubId, title and body are required.'], 400);
        }

        $club = Club::find($clubId);
        if (!$club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $announcementId = 'a-' . substr(md5(uniqid()), 0, 8);
        DB::table('announcements')->insert([
            'id' => $announcementId,
            'club_id' => $clubId,
            'title' => $title,
            'body' => $body,
            'created_at' => now(),
        ]);

        // Notify club members only — not the leader who published it.
        $memberIds = DB::table('club_members')->where('club_id', $clubId)->pluck('user_id');
        foreach ($memberIds as $memberId) {
            if ((int) $memberId === $userId || (int) $memberId === (int) $club->leader_id) {
                continue;
            }
            DB::table('notifications')->insert([
                'id' => 'n-' . substr(md5(uniqid()), 0, 8),
                'user_id' => (int) $memberId,
                'title' => $title,
                'message' => $body,
                'is_read' => 0,
                'created_at' => now(),
            ]);
        }

        return response()->json(['ok' => true, 'announcementId' => $announcementId]);
    }

    public function removeMember(Request $request, $clubId, $userId)
    {
        $leaderId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $leaderId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $club = Club::find($clubId);
        if (! $club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }
        if ((int) $club->leader_id !== $leaderId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }
        if ((int) $club->leader_id === (int) $userId) {
            return response()->json(['error' => 'Cannot remove the club leader.'], 400);
        }

        DB::table('club_members')->where('club_id', $clubId)->where('user_id', (int) $userId)->delete();

        return response()->json(['ok' => true]);
    }

    public function deleteEvent(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $event = ClubEvent::find($id);
        if (! $event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }

        $club = Club::find($event->club_id);
        if (! $club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        DB::table('event_registrations')->where('event_id', $id)->delete();
        $event->delete();

        return response()->json(['ok' => true]);
    }

    public function eventRegistrations(Request $request, $eventId)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $event = ClubEvent::find($eventId);
        if (! $event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }

        $club = Club::find($event->club_id);
        if (! $club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $hasAttended = Schema::hasColumn('event_registrations', 'attended');
        $registrations = DB::table('event_registrations')->where('event_id', $eventId)->get();

        $users = $registrations->map(function ($reg) use ($hasAttended) {
            $user = User::find($reg->user_id);

            return [
                'id' => (int) $reg->user_id,
                'name' => $user->name ?? '',
                'email' => $user->email ?? '',
                'avatar' => $user->avatar ?? '',
                'attended' => $hasAttended ? (int) ($reg->attended ?? 0) : 0,
            ];
        })->values();

        return response()->json(['registrations' => $users]);
    }

    public function markAttendance(Request $request, $eventId)
    {
        $leaderId = (int) $request->input('user_id', $request->query('user_id'));
        $studentId = (int) $request->input('student_id');
        $attended = filter_var($request->input('attended'), FILTER_VALIDATE_BOOLEAN);

        if (! $leaderId || ! $studentId) {
            return response()->json(['error' => 'user_id and student_id are required.'], 400);
        }

        if (! Schema::hasColumn('event_registrations', 'attended')) {
            return response()->json(['error' => 'Attendance tracking is not available.'], 400);
        }

        $event = ClubEvent::find($eventId);
        if (! $event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }

        $club = Club::find($event->club_id);
        if (! $club || (int) $club->leader_id !== $leaderId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $updated = DB::table('event_registrations')
            ->where('event_id', $eventId)
            ->where('user_id', $studentId)
            ->update(['attended' => $attended ? 1 : 0]);

        if (! $updated) {
            return response()->json(['error' => 'Registration not found.'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function updateAnnouncement(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $row = DB::table('announcements')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['error' => 'Announcement not found.'], 404);
        }

        $club = Club::find($row->club_id);
        if (! $club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $title = trim((string) $request->input('title', $row->title));
        $body = trim((string) $request->input('body', $row->body));

        $patch = ['title' => $title, 'body' => $body];
        if (Schema::hasColumn('announcements', 'updated_at')) {
            $patch['updated_at'] = now();
        }

        DB::table('announcements')->where('id', $id)->update($patch);

        return response()->json(['ok' => true]);
    }

    public function deleteAnnouncement(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $row = DB::table('announcements')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['error' => 'Announcement not found.'], 404);
        }

        $club = Club::find($row->club_id);
        if (! $club || (int) $club->leader_id !== $userId) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        DB::table('announcements')->where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    public function dashboard(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubIds = Club::where('leader_id', $userId)->pluck('id')->toArray();
        if (empty($clubIds)) {
            return response()->json([
                'totalMembers' => 0,
                'pendingRequests' => 0,
                'upcomingEvents' => 0,
                'totalRegistrations' => 0,
            ]);
        }

        $totalMembers = DB::table('club_members')->whereIn('club_id', $clubIds)->count();
        $pendingRequests = MembershipRequest::whereIn('club_id', $clubIds)->where('status', 'pending')->count();

        $today = now()->toDateString();
        $upcomingEvents = DB::table('events')
            ->whereIn('club_id', $clubIds)
            ->where(function ($q) use ($today) {
                $q->where('event_date', '>=', $today)->orWhereNull('event_date');
            })
            ->count();

        $eventIds = DB::table('events')->whereIn('club_id', $clubIds)->pluck('id');
        $totalRegistrations = $eventIds->isEmpty()
            ? 0
            : DB::table('event_registrations')->whereIn('event_id', $eventIds)->count();

        return response()->json([
            'totalMembers' => $totalMembers,
            'pendingRequests' => $pendingRequests,
            'upcomingEvents' => $upcomingEvents,
            'totalRegistrations' => $totalRegistrations,
        ]);
    }

    public function listMembershipRequests(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubIds = Club::where('leader_id', $userId)->pluck('id')->toArray();
        if (empty($clubIds)) {
            return response()->json(['requests' => []]);
        }

        $requests = MembershipRequest::whereIn('club_id', $clubIds)
            ->where('status', 'pending')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'clubId' => $r->club_id,
                    'userId' => (int) $r->user_id,
                    'status' => $r->status,
                    'createdAt' => optional($r->created_at)->toISOString(),
                ];
            });

        return response()->json(['requests' => $requests]);
    }

    /**
     * Save an uploaded data-URL image onto the public disk and return its URL.
     * An existing http(s) URL is kept as-is.
     */
    private function storedImage($image, Request $request): ?string
    {
        if (! is_string($image) || $image === '') {
            return null;
        }
        if (! str_starts_with($image, 'data:image/')) {
            return $image;
        }
        if (! preg_match('#^data:image/(jpeg|jpg|png|gif|webp);base64,#i', $image, $matches)) {
            return null;
        }

        $ext = strtolower($matches[1]) === 'jpeg' ? 'jpg' : strtolower($matches[1]);
        $binary = base64_decode(substr($image, strpos($image, ',') + 1), true);
        if ($binary === false || strlen($binary) > 2_500_000) {
            return null;
        }

        $path = 'events/'.uniqid('event_', true).'.'.$ext;
        Storage::disk('public')->put($path, $binary);

        return $request->getSchemeAndHttpHost().'/storage/'.$path;
    }

    /**
     * Transform a club to the API shape.
     */
    private function transform(Club $club): array
    {
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
            'activities' => $club->activities->pluck('activity')->toArray(),
            'memberIds' => array_map('intval', $memberIds),
            'pendingMemberIds' => array_map('intval', $pendingIds),
        ];
    }
}
