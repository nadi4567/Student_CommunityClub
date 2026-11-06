<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $notifications = AppNotification::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'userId' => $n->user_id,
                    'title' => $n->title,
                    'message' => $n->message,
                    'read' => (bool) $n->is_read,
                    'createdAt' => optional($n->created_at)->toISOString(),
                ];
            });

        return response()->json(['notifications' => $notifications]);
    }

    public function markRead(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        DB::table('notifications')->where('user_id', $userId)->update(['is_read' => 1]);
        return response()->json(['ok' => true]);
    }
}
