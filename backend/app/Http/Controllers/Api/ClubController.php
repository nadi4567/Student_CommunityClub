<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function store(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $name = trim((string) $request->input('name', ''));
        if ($name === '') {
            return response()->json(['error' => 'Club name is required.'], 400);
        }

        $image = $this->storedImage($request->input('image'), $request);
        if (! $image) {
            return response()->json(['error' => 'Please upload a club image.'], 422);
        }

        $id = $request->input('id') ?: ('c-' . substr(md5(uniqid('', true)), 0, 8));
        $club = Club::create([
            'id' => $id,
            'name' => $name,
            'category' => $request->input('category', 'Arts & Design'),
            'tagline' => $request->input('tagline', ''),
            'description' => $request->input('description', ''),
            'image' => $image,
            'cover' => $image,
            'leader_id' => $userId,
            'location' => $request->input('location', 'Main Campus'),
            'founded' => $request->input('founded', date('M Y')),
            'meeting_time' => $request->input('meetingTime', $request->input('meeting_time', 'To be announced')),
        ]);

        $this->syncActivities($club->id, $request->input('activities', []));

        \DB::table('club_members')->insertOrIgnore([
            'club_id' => $club->id,
            'user_id' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = \App\Models\User::find($userId);
        if ($user && $user->role === 'student') {
            $user->role = 'leader';
            $user->save();
        }

        return response()->json(['ok' => true, 'club' => $this->transform($club->fresh('activities'))]);
    }

    public function update(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        $club = Club::find($id);
        if (!$club) {
            return response()->json(['error' => 'Club not found.'], 404);
        }
        if ($userId && (int) $club->leader_id !== $userId) {
            $actor = \App\Models\User::find($userId);
            if (! $actor || $actor->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized.'], 403);
            }
        }

        $updates = [
            'name' => $request->input('name', $club->name),
            'category' => $request->input('category', $club->category),
            'tagline' => $request->input('tagline', $club->tagline),
            'description' => $request->input('description', $club->description),
            'location' => $request->input('location', $club->location),
            'meeting_time' => $request->input('meetingTime', $request->input('meeting_time', $club->meeting_time)),
        ];
        $image = $this->storedImage($request->input('image'), $request);
        if ($image) {
            $updates['image'] = $image;
            $updates['cover'] = $image;
        }
        $club->update($updates);

        if ($request->has('activities')) {
            $this->syncActivities($club->id, $request->input('activities', []));
        }

        return response()->json(['ok' => true, 'club' => $this->transform($club->fresh('activities'))]);
    }

    private function storedImage($image, Request $request): ?string
    {
        if (! is_string($image) || ! str_starts_with($image, 'data:image/')) {
            return null;
        }
        if (! preg_match('#^data:image/(jpeg|jpg|png|gif|webp);base64,#i', $image, $matches)) {
            return null;
        }

        $ext = strtolower($matches[1]) === 'jpeg' ? 'jpg' : strtolower($matches[1]);
        $binary = base64_decode(substr($image, strpos($image, ',') + 1), true);
        if ($binary === false || strlen($binary) > 2_500_000) {
            return null;
        }

        $path = 'clubs/'.uniqid('club_', true).'.'.$ext;
        Storage::disk('public')->put($path, $binary);

        return $request->getSchemeAndHttpHost().'/storage/'.$path;
    }

    private function syncActivities(string $clubId, $activities): void
    {
        $list = is_array($activities) ? $activities : preg_split('/\r\n|\r|\n/', (string) $activities);
        \DB::table('club_activities')->where('club_id', $clubId)->delete();
        foreach ($list as $activity) {
            $activity = trim((string) $activity);
            if ($activity === '') {
                continue;
            }
            \DB::table('club_activities')->insert(['club_id' => $clubId, 'activity' => $activity]);
        }
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
            'featured' => $club->featured,
            'activities' => $club->activities->pluck('activity')->toArray(),
            'memberIds' => array_map('intval', $memberIds),
            'pendingMemberIds' => array_map('intval', $pendingIds),
        ];
    }
}
