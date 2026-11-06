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

        // notify leader
        $user = \App\Models\User::find($userId);
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
}
