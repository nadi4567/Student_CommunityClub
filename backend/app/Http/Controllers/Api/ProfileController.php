<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        return response()->json(['user' => $this->transform($user)]);
    }

    public function update(Request $request)
    {
        $userId = (int) $request->input('user_id', $request->query('user_id'));
        if (!$userId) {
            return response()->json(['error' => 'user_id required.'], 400);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $patch = [];
        if ($request->has('name')) $patch['name'] = $request->input('name');
        if ($request->has('email')) $patch['email'] = $request->input('email');
        if ($request->has('phone')) $patch['phone'] = $request->input('phone');
        if ($request->has('password')) $patch['password'] = $request->input('password');
        if ($request->has('avatar')) $patch['avatar'] = $request->input('avatar');

        $user->update($patch);

        return response()->json(['user' => $this->transform($user->fresh())]);
    }

    private function transform(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'password' => $user->password,
            'role' => $user->role,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'memberSince' => $user->member_since,
            'banned' => (bool) $user->banned,
            'featured' => (bool) $user->featured,
        ];
    }
}
