<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\MembershipRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MembershipController extends Controller
{
    public function join(Request $request, $clubId)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $club = Club::find($clubId);
        if (!$club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }

        $user = \App\Models\User::find($userId);
        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Admins cannot join clubs.'], 403);
        }

        // already member or pending
        $isMember = DB::table('club_members')->where('club_id', $clubId)->where('user_id', $userId)->exists();
        $isPending = MembershipRequest::where('club_id', $clubId)->where('user_id', $userId)->where('status', 'pending')->exists();
        if ($isMember || $isPending) {
            return response()->json(['ok' => true, 'message' => 'Already a member or request pending.']);
        }

        $requestId = 'mr-' . substr(md5(uniqid()), 0, 8);
        MembershipRequest::create([
            'id' => $requestId,
            'club_id' => $clubId,
            'user_id' => $userId,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        DB::table('notifications')->insert([
            'id' => 'n-' . substr(md5(uniqid()), 0, 8),
            'user_id' => $club->leader_id,
            'title' => 'New membership request',
            'message' => ($user->name ?? 'A student') . " requested to join {$club->name}.",
            'is_read' => 0,
            'created_at' => now(),
        ]);

        return response()->json(['ok' => true, 'requestId' => $requestId]);
    }

    public function cancelJoin(Request $request, $clubId)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (! $userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        MembershipRequest::where('club_id', $clubId)
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->delete();

        return response()->json(['ok' => true]);
    }

    public function myRequests(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $requests = MembershipRequest::where('user_id', $userId)->get()->map(function ($r) {
            return [
                'id' => $r->id,
                'clubId' => $r->club_id,
                'userId' => $r->user_id,
                'status' => $r->status,
                'createdAt' => optional($r->created_at)->toISOString(),
            ];
        });

        return response()->json(['requests' => $requests]);
    }

    public function myClubs(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $clubIds = DB::table('club_members')->where('user_id', $userId)->pluck('club_id');
        $clubs = Club::whereIn('id', $clubIds)->get();
        return response()->json(['clubs' => $clubs]);
    }

    public function review(Request $request, $id)
    {
        $status = $request->input('status');
        $leaderId = (int) $request->input('user_id', $request->query('user_id'));
        if (! in_array($status, ['approved', 'rejected'], true) || ! $leaderId) {
            return response()->json(['error' => 'user_id and status (approved|rejected) are required.'], 400);
        }

        $member = MembershipRequest::find($id);
        if (! $member) {
            return response()->json(['error' => 'Membership request not found.'], 404);
        }

        $club = Club::find($member->club_id);
        if (! $club || (int) $club->leader_id !== $leaderId) {
            $actor = \App\Models\User::find($leaderId);
            if (! $actor || $actor->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized.'], 403);
            }
        }

        $member->status = $status;
        $member->save();

        if ($status === 'approved') {
            DB::table('club_members')->insertOrIgnore([
                'club_id' => $member->club_id,
                'user_id' => $member->user_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('notifications')->insert([
            'id' => 'n-' . substr(md5(uniqid('', true)), 0, 8),
            'user_id' => $member->user_id,
            'title' => $status === 'approved' ? 'Membership approved' : 'Membership declined',
            'message' => $status === 'approved'
                ? "You are now a member of {$club->name}."
                : "Your request to join {$club->name} was declined.",
            'is_read' => 0,
            'created_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function removeMember(Request $request, $clubId, $userId)
    {
        $leaderId = (int) $request->input('user_id', $request->query('user_id'));
        $club = Club::find($clubId);
        if (! $club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }
        if ((int) $club->leader_id === (int) $userId) {
            return response()->json(['error' => 'Cannot remove the club leader.'], 400);
        }
        if ($leaderId && (int) $club->leader_id !== $leaderId) {
            $actor = \App\Models\User::find($leaderId);
            if (! $actor || $actor->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized.'], 403);
            }
        }

        DB::table('club_members')->where('club_id', $clubId)->where('user_id', (int) $userId)->delete();
        return response()->json(['ok' => true]);
    }
}
