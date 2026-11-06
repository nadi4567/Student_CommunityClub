<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubActivity;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    public function index(Request $request)
    {
        $clubs = Club::with(['activities', 'leader'])->get()->map(function ($club) {
            return $this->transform($club);
        });

        return response()->json(['clubs' => $clubs]);
    }

    public function show($id)
    {
        $club = Club::with(['activities', 'leader'])->find($id);
        if (!$club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }
        return response()->json(['club' => $this->transform($club)]);
    }

    private function transform($club): array
    {
        $memberIds = \DB::table('club_members')->where('club_id', $club->id)->pluck('user_id')->toArray();
        $pendingIds = \DB::table('membership_requests')
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
            'activities' => $club->activities->pluck('activity')->toArray(),
            'memberIds' => array_map('intval', $memberIds),
            'pendingMemberIds' => array_map('intval', $pendingIds),
        ];
    }
}
