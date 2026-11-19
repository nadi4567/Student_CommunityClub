<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'role')) {
                    $table->string('role', 20)->default('student');
                }
                if (! Schema::hasColumn('users', 'phone')) {
                    $table->string('phone', 50)->default('');
                }
                if (! Schema::hasColumn('users', 'avatar')) {
                    $table->string('avatar', 10)->default('');
                }
                if (! Schema::hasColumn('users', 'member_since')) {
                    $table->string('member_since', 50)->nullable();
                }
                if (! Schema::hasColumn('users', 'banned')) {
                    $table->boolean('banned')->default(false);
                }
                if (! Schema::hasColumn('users', 'featured')) {
                    $table->boolean('featured')->default(false);
                }
            });
        }

        if (! Schema::hasTable('app_state')) {
            Schema::create('app_state', function (Blueprint $table) {
                $table->unsignedBigInteger('id')->primary();
                $table->longText('state')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('clubs')) {
            Schema::create('clubs', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->string('name');
                $table->string('category')->nullable();
                $table->text('description')->nullable();
                $table->string('tagline')->nullable();
                $table->text('image')->nullable();
                $table->text('cover')->nullable();
                $table->unsignedBigInteger('leader_id')->nullable();
                $table->string('location')->nullable();
                $table->string('founded')->nullable();
                $table->string('meeting_time')->nullable();
                $table->boolean('featured')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('club_activities')) {
            Schema::create('club_activities', function (Blueprint $table) {
                $table->id();
                $table->string('club_id', 50);
                $table->string('activity');
            });
        }

        if (! Schema::hasTable('club_members')) {
            Schema::create('club_members', function (Blueprint $table) {
                $table->id();
                $table->string('club_id', 50);
                $table->unsignedBigInteger('user_id');
                $table->timestamps();
                $table->unique(['club_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->string('club_id', 50);
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('event_date')->nullable();
                $table->string('event_time')->nullable();
                $table->string('location')->nullable();
                $table->text('image')->nullable();
                $table->unsignedInteger('capacity')->default(30);
                $table->date('registration_deadline')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('event_registrations')) {
            Schema::create('event_registrations', function (Blueprint $table) {
                $table->id();
                $table->string('event_id', 50);
                $table->unsignedBigInteger('user_id');
                $table->unique(['event_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('membership_requests')) {
            Schema::create('membership_requests', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->string('club_id', 50);
                $table->unsignedBigInteger('user_id');
                $table->string('status', 20)->default('pending');
                $table->timestamp('created_at')->nullable();
            });
        }

        if (! Schema::hasTable('leader_requests')) {
            Schema::create('leader_requests', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->unsignedBigInteger('user_id');
                $table->string('club_name');
                $table->string('category')->nullable();
                $table->text('reason')->nullable();
                $table->string('document_name')->nullable();
                $table->string('status', 20)->default('pending');
                $table->timestamp('created_at')->nullable();
                $table->timestamp('reviewed_at')->nullable();
            });
        }

        if (! Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->unsignedBigInteger('user_id');
                $table->string('title');
                $table->text('message')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamp('created_at')->nullable();
            });
        }

        if (! Schema::hasTable('announcements')) {
            Schema::create('announcements', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->string('club_id', 50);
                $table->string('title');
                $table->text('body')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        if (! Schema::hasTable('reports')) {
            Schema::create('reports', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->unsignedBigInteger('reporter_id');
                $table->string('target_type');
                $table->string('target_id');
                $table->text('reason')->nullable();
                $table->string('status', 20)->default('open');
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('leader_requests');
        Schema::dropIfExists('membership_requests');
        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('events');
        Schema::dropIfExists('club_members');
        Schema::dropIfExists('club_activities');
        Schema::dropIfExists('clubs');
        Schema::dropIfExists('app_state');
    }
};
