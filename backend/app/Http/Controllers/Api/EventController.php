<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClubEvent;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = ClubEvent::all()->map(fn ($e) => $this->transform($e));
        return response()->json(['events' => $events]);
    }

    public function show($id)
    {
        $event = ClubEvent::find($id);
        if (!$event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }
        return response()->json(['event' => $this->transform($event)]);
    }

    public function register(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $event = ClubEvent::find($id);
        if (!$event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }

        $user = \App\Models\User::find($userId);
        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Admins cannot register for events.'], 403);
        }

        $club = \App\Models\Club::find($event->club_id);
        if ($club && (int) $club->leader_id === $userId) {
            return response()->json(['error' => 'Club leaders cannot register for their own events.'], 403);
        }

        $exists = DB::table('event_registrations')->where('event_id', $id)->where('user_id', $userId)->exists();
        if (!$exists) {
            DB::table('event_registrations')->insert(['event_id' => $id, 'user_id' => $userId]);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        $event = ClubEvent::find($id);
        if (!$event) {
            return response()->json(['error' => 'Event not found.'], 404);
        }
        $club = \App\Models\Club::find($event->club_id);
        if ($userId && $club && (int) $club->leader_id !== $userId) {
            $actor = \App\Models\User::find($userId);
            if (! $actor || $actor->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized.'], 403);
            }
        }
        DB::table('event_registrations')->where('event_id', $id)->delete();
        $event->delete();
        return response()->json(['ok' => true]);
    }

    public function unregister(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        DB::table('event_registrations')->where('event_id', $id)->where('user_id', $userId)->delete();
        return response()->json(['ok' => true]);
    }

    private function transform($event): array
    {
        $registeredIds = EventRegistration::where('event_id', $event->id)->pluck('user_id')->toArray();
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
    }
}
