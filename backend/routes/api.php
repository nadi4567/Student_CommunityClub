<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StateController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\LeaderRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/state', [StateController::class, 'show']);
Route::post('/state', [StateController::class, 'update']);

// Student member features
Route::get('/clubs', [ClubController::class, 'index']);
Route::get('/clubs/{id}', [ClubController::class, 'show']);
Route::post('/clubs/{id}/join', [MembershipController::class, 'join']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::post('/events/{id}/register', [EventController::class, 'register']);
Route::delete('/events/{id}/register', [EventController::class, 'unregister']);

Route::get('/membership-requests', [MembershipController::class, 'myRequests']);
Route::get('/my/clubs', [MembershipController::class, 'myClubs']);

Route::post('/leader-requests', [LeaderRequestController::class, 'store']);
Route::get('/leader-requests', [LeaderRequestController::class, 'myRequests']);

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/read', [NotificationController::class, 'markRead']);

Route::get('/profile', [ProfileController::class, 'show']);
Route::put('/profile', [ProfileController::class, 'update']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});