<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Club extends Model
{
    protected $table = 'clubs';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'id', 'name', 'category', 'description', 'tagline', 'image', 'cover',
        'leader_id', 'location', 'founded', 'meeting_time',
    ];

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'club_members', 'club_id', 'user_id');
    }

    public function activities()
    {
        return $this->hasMany(ClubActivity::class, 'club_id');
    }

    public function events()
    {
        return $this->hasMany(ClubEvent::class, 'club_id');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'club_id');
    }
}
