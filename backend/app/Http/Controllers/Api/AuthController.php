<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $name = trim($request->input('name', ''));
        $email = trim($request->input('email', ''));
        $password = $request->input('password', '');
        $phone = trim($request->input('phone', ''));

        if ($name === '' || $email === '' || $password === '') {
            return response()->json(['error' => 'Name, email and password are required.'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with that email already exists.'], 409);
        }

        $parts = preg_split('/\s+/', $name);
        $initials = '';
        foreach ($parts as $p) {
            if ($p !== '') $initials .= strtoupper(substr($p, 0, 1));
        }
        $avatar = substr($initials, 0, 2);
        $memberSince = date('M Y');

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'student',
            'phone' => $phone,
            'avatar' => $avatar,
            'member_since' => $memberSince,
        ]);

        return response()->json([
            'user' => $this->transform($user),
            'error' => null,
        ]);
    }

    public function login(Request $request)
    {
        $email = trim($request->input('email', ''));
        $password = $request->input('password', '');

        $user = User::where('email', $email)->where('password', $password)->first();
        if (!$user) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        if ($user->banned) {
            return response()->json(['error' => 'Your account has been banned.'], 403);
        }

        return response()->json([
            'user' => $this->transform($user),
            'error' => null,
        ]);
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
