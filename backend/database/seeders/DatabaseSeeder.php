<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->where('email', 'test@example.com')->delete();

        $demo = [
            [
                'id' => 1,
                'name' => 'Alex Carter',
                'email' => 'alex@example.com',
                'password' => 'student123',
                'role' => 'student',
                'phone' => '+60 12 345 6789',
                'avatar' => 'AC',
                'member_since' => 'May 2025',
            ],
            [
                'id' => 2,
                'name' => 'Sarah Johnson',
                'email' => 'sarah@example.com',
                'password' => 'leader123',
                'role' => 'leader',
                'phone' => '+60 13 222 1100',
                'avatar' => 'SJ',
                'member_since' => 'Jan 2024',
            ],
            [
                'id' => 3,
                'name' => 'Maya Tan',
                'email' => 'admin@example.com',
                'password' => 'admin123',
                'role' => 'admin',
                'phone' => '+60 11 888 0000',
                'avatar' => 'MT',
                'member_since' => 'Jan 2023',
            ],
            [
                'id' => 4,
                'name' => 'Liam Chen',
                'email' => 'liam@example.com',
                'password' => 'student123',
                'role' => 'student',
                'phone' => '+60 16 444 2211',
                'avatar' => 'LC',
                'member_since' => 'Mar 2025',
            ],
            [
                'id' => 5,
                'name' => 'Nina Patel',
                'email' => 'nina@example.com',
                'password' => 'student123',
                'role' => 'student',
                'phone' => '+60 17 555 3344',
                'avatar' => 'NP',
                'member_since' => 'Feb 2025',
            ],
        ];

        foreach ($demo as $row) {
            $plain = $row['password'];
            User::query()->updateOrCreate(
                ['email' => $row['email']],
                [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'password' => Hash::make($plain),
                    'role' => $row['role'],
                    'phone' => $row['phone'],
                    'avatar' => $row['avatar'],
                    'member_since' => $row['member_since'],
                    'banned' => false,
                    'featured' => false,
                ]
            );
        }
    }
};
