<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StateController extends Controller
{
    public function show()
    {
        $row = DB::table('app_state')->where('id', 1)->first();
        if ($row) {
            return response()->json(['state' => json_decode($row->state, true)]);
        }
        return response()->json(['state' => null]);
    }

    public function update(Request $request)
    {
        $state = $request->input('state');
        if (!is_array($state)) {
            return response()->json(['error' => 'state must be an object'], 400);
        }

        if (isset($state['users']) && is_array($state['users'])) {
            foreach ($state['users'] as $u) {
                if (!is_array($u) || empty($u['id']) || empty($u['email'])) {
                    continue;
                }
                DB::table('users')->updateOrInsert(
                    ['id' => (int) $u['id']],
                    [
                        'name' => $u['name'] ?? '',
                        'email' => $u['email'],
                        'password' => $u['password'] ?? '',
                        'role' => $u['role'] ?? 'student',
                        'phone' => $u['phone'] ?? '',
                        'avatar' => $u['avatar'] ?? '',
                        'member_since' => $u['memberSince'] ?? null,
                        'updated_at' => now(),
                    ]
                );
            }
        }

        DB::table('app_state')->updateOrInsert(
            ['id' => 1],
            ['state' => json_encode($state), 'updated_at' => now()]
        );
        return response()->json(['ok' => true]);
    }
}
