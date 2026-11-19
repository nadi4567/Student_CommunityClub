<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('event_registrations') && ! Schema::hasColumn('event_registrations', 'attended')) {
            Schema::table('event_registrations', function (Blueprint $table) {
                $table->unsignedTinyInteger('attended')->default(0)->after('user_id');
            });
        }

        if (Schema::hasTable('events') && ! Schema::hasColumn('events', 'status')) {
            Schema::table('events', function (Blueprint $table) {
                $table->string('status', 20)->default('scheduled')->after('registration_deadline');
            });
        }

        if (Schema::hasTable('announcements') && ! Schema::hasColumn('announcements', 'updated_at')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            });
        }

        if (! Schema::hasTable('platform_announcements')) {
            Schema::create('platform_announcements', function (Blueprint $table) {
                $table->string('id', 50)->primary();
                $table->string('title');
                $table->text('body')->nullable();
                $table->timestamp('created_at')->nullable();
                $table->timestamp('updated_at')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('event_registrations') && Schema::hasColumn('event_registrations', 'attended')) {
            Schema::table('event_registrations', function (Blueprint $table) {
                $table->dropColumn('attended');
            });
        }

        if (Schema::hasTable('events') && Schema::hasColumn('events', 'status')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }

        if (Schema::hasTable('announcements') && Schema::hasColumn('announcements', 'updated_at')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->dropColumn('updated_at');
            });
        }

        Schema::dropIfExists('platform_announcements');
    }
};