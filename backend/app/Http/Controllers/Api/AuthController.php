<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $name = trim((string) $request->input('name', ''));
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');
        $phone = trim((string) $request->input('phone', ''));

        if ($name === '' || $email === '' || $password === '') {
            return response()->json(['error' => 'Name, email and password are required.'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with that email already exists.'], 409);
        }

        $parts = preg_split('/\s+/', $name) ?: [];
        $initials = '';
        foreach ($parts as $p) {
            if ($p !== '') {
                $initials .= strtoupper(substr($p, 0, 1));
            }
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'student',
            'phone' => $phone,
            'avatar' => substr($initials, 0, 2),
            'member_since' => date('M j, Y'),
            'banned' => false,
            'featured' => false,
        ]);

        return response()->json([
            'user' => $this->transform($user, $password),
            'error' => null,
        ]);
    }

    public function login(Request $request)
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $password = (string) $request->input('password', '');

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if (! $user || ! $this->passwordMatches($user->password, $password)) {
            return response()->json(['error' => 'Invalid email or password.'], 401);
        }

        if ($user->banned) {
            return response()->json(['error' => 'Your account has been banned.'], 403);
        }

        return response()->json([
            'user' => $this->transform($user, $password),
            'error' => null,
        ]);
    }

    private function passwordMatches(?string $stored, string $plain): bool
    {
        if ($stored === null || $stored === '') {
            return false;
        }

        // Use Laravel's Hash::check for bcrypt/argon2i hashes
        if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2a$') || str_starts_with($stored, '$2b$') || str_starts_with($stored, '$2x$')) {
            return Hash::check($plain, $stored);
        }

        // For other hash formats, try plain comparison as fallback
        return hash_equals($stored, $plain);
    }

    private function transform(User $user, string $plainPassword = ''): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'password' => $plainPassword,
            'role' => $user->role ?: 'student',
            'phone' => $user->phone ?? '',
            'avatar' => $user->avatar ?? '',
            'memberSince' => optional($user->created_at)->format('M j, Y') ?: ($user->member_since ?? ''),
            'createdAt' => optional($user->created_at)->toISOString(),
            'banned' => (bool) $user->banned,
            'featured' => (bool) $user->featured,
        ];
    }
}
