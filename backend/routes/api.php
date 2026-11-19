<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StateController;
use App\Http\Controllers\Api\ClubController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\LeaderRequestController;
use App\Http\Controllers\Api\LeaderController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/state', [StateController::class, 'show']);
Route::post('/state', [StateController::class, 'update']);

// Student member features
Route::get('/clubs', [ClubController::class, 'index']);
Route::post('/clubs', [ClubController::class, 'store']);
Route::get('/clubs/{id}', [ClubController::class, 'show']);
Route::put('/clubs/{id}', [ClubController::class, 'update']);
Route::post('/clubs/{id}/join', [MembershipController::class, 'join']);
Route::delete('/clubs/{id}/join', [MembershipController::class, 'cancelJoin']);
Route::delete('/clubs/{clubId}/members/{userId}', [MembershipController::class, 'removeMember']);
Route::post('/membership-requests/{id}/review', [MembershipController::class, 'review']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::post('/events/{id}/register', [EventController::class, 'register']);
Route::delete('/events/{id}/register', [EventController::class, 'unregister']);
Route::delete('/events/{id}', [EventController::class, 'destroy']);

Route::get('/membership-requests', [MembershipController::class, 'myRequests']);
Route::get('/my/clubs', [MembershipController::class, 'myClubs']);

// Student leader features (user_id via query or body)
Route::post('/leader-requests', [LeaderRequestController::class, 'store']);
Route::get('/leader-requests', [LeaderRequestController::class, 'myRequests']);
Route::post('/leader-requests/review', [LeaderController::class, 'reviewRequest'])->name('leader.review');
Route::get('/leader-requests/my', [LeaderController::class, 'myRequests'])->name('leader.requests.my');
Route::get('/leader-clubs', [LeaderController::class, 'myClubs'])->name('leader.clubs');
Route::get('/leader-clubs/{clubId}/members', [LeaderController::class, 'clubMembers'])->name('leader.club.members');
Route::post('/leader-clubs/{clubId}/members/{userId}', [LeaderController::class, 'reviewMembership'])->name('leader.club.members.review');
Route::post('/leader-events', [LeaderController::class, 'createEvent'])->name('leader.events.create');
Route::put('/leader-events/{id}', [LeaderController::class, 'updateEvent'])->name('leader.events.update');
Route::post('/leader-clubs/{clubId}/announcements', [LeaderController::class, 'publishAnnouncement'])->name('leader.announcements');

// Leader management
Route::delete('/leader-clubs/{clubId}/members/{userId}', [LeaderController::class, 'removeMember'])->name('leader.club.members.remove');
Route::delete('/leader-events/{id}', [LeaderController::class, 'deleteEvent'])->name('leader.events.delete');
Route::get('/leader-events/{id}/registrations', [LeaderController::class, 'eventRegistrations'])->name('leader.events.registrations');
Route::post('/leader-events/{id}/attendance', [LeaderController::class, 'markAttendance'])->name('leader.events.attendance');
Route::put('/announcements/{id}', [LeaderController::class, 'updateAnnouncement'])->name('leader.announcements.update');
Route::delete('/announcements/{id}', [LeaderController::class, 'deleteAnnouncement'])->name('leader.announcements.delete');
Route::get('/leader/dashboard', [LeaderController::class, 'dashboard'])->name('leader.dashboard');
Route::get('/leader/membership-requests', [LeaderController::class, 'listMembershipRequests'])->name('leader.membership.requests');

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/read', [NotificationController::class, 'markRead']);

Route::get('/profile', [ProfileController::class, 'show']);
Route::put('/profile', [ProfileController::class, 'update']);

Route::post('/reports', [AdminController::class, 'storeReport']);

// Admin features
Route::get('/admin/leader-requests', [AdminController::class, 'indexLeaderRequests']);
Route::post('/admin/leader-requests/review', [LeaderController::class, 'reviewRequest'])->name('admin.leader.review');
Route::get('/admin/users', [AdminController::class, 'indexUsers'])->name('admin.users');
Route::put('/admin/users/{id}', [AdminController::class, 'updateUser'])->name('admin.users.update');
Route::get('/admin/clubs', [AdminController::class, 'indexClubs'])->name('admin.clubs');
Route::post('/admin/clubs', [AdminController::class, 'createClub'])->name('admin.clubs.create');
Route::put('/admin/clubs/{id}', [AdminController::class, 'updateClub'])->name('admin.clubs.update');
Route::post('/admin/clubs/{clubId}/assign-leader', [AdminController::class, 'assignLeader'])->name('admin.clubs.assignLeader');
Route::delete('/admin/clubs/{id}', [AdminController::class, 'deleteClub'])->name('admin.clubs.delete');
Route::get('/admin/events', [AdminController::class, 'indexEvents'])->name('admin.events');
Route::delete('/admin/events/{id}', [AdminController::class, 'deleteEvent'])->name('admin.events.delete');
Route::get('/admin/stats', [AdminController::class, 'stats'])->name('admin.stats');
Route::get('/admin/platform-announcements', [AdminController::class, 'indexPlatformAnnouncements'])->name('admin.platformAnnouncements.index');
Route::post('/admin/platform-announcements', [AdminController::class, 'storePlatformAnnouncement'])->name('admin.platformAnnouncements.store');
Route::delete('/admin/platform-announcements/{id}', [AdminController::class, 'destroyPlatformAnnouncement'])->name('admin.platformAnnouncements.destroy');
Route::get('/admin/reports', [AdminController::class, 'indexReports'])->name('admin.reports');
Route::put('/admin/reports/{id}', [AdminController::class, 'resolveReport'])->name('admin.reports.resolve');

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});