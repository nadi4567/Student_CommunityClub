<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaderRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaderRequestController extends Controller
{
    public function store(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        $clubName = trim($request->input('clubName', $request->input('club_name', '')));
        $category = trim($request->input('category', ''));
        $reason = trim($request->input('reason', ''));
        $documentName = $request->input('documentName', $request->input('document_name'));

        if (!$userId || $clubName === '' || $reason === '') {
            return response()->json(['error' => 'user_id, clubName and reason are required.'], 400);
        }

        // prevent duplicate pending
        $exists = LeaderRequest::where('user_id', $userId)->where('status', 'pending')->exists();
        if ($exists) {
            return response()->json(['error' => 'You already have a pending leader request.'], 409);
        }

        $id = 'lr-' . substr(md5(uniqid()), 0, 8);
        LeaderRequest::create([
            'id' => $id,
            'user_id' => $userId,
            'club_name' => $clubName,
            'category' => $category,
            'reason' => $reason,
            'document_name' => $documentName,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        // notify admins
        $user = User::find($userId);
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            DB::table('notifications')->insert([
                'id' => 'n-' . substr(md5(uniqid()), 0, 8),
                'user_id' => $admin->id,
                'title' => 'Leader request pending',
                'message' => ($user->name ?? 'A student') . " applied to lead {$clubName}.",
                'is_read' => 0,
                'created_at' => now(),
            ]);
        }

        return response()->json(['ok' => true, 'requestId' => $id]);
    }

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
}
