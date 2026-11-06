<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClubEvent;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $exists = EventRegistration::where('event_id', $id)->where('user_id', $userId)->exists();
        if (!$exists) {
            EventRegistration::create(['event_id' => $id, 'user_id' => $userId]);
        }

        return response()->json(['ok' => true]);
    }

    public function unregister(Request $request, $id)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        EventRegistration::where('event_id', $id)->where('user_id', $userId)->delete();
        return response()->json(['ok' => true]);
    }

    private function transform($event): array
    {
        $registeredIds = EventRegistration::where('event_id', $event->id)->pluck('user_id')->toArray();

        return [
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
            'deadline' => optional($event->registration_deadline)->format('Y-m-d'),
        ];
    }
}
