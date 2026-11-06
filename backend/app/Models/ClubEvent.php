<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubEvent extends Model
{
    protected $table = 'events';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'id', 'club_id', 'title', 'description', 'event_date', 'event_time',
        'location', 'image', 'capacity', 'registration_deadline',
    ];

    protected $casts = [
        'event_date' => 'date',
        'registration_deadline' => 'date',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class, 'club_id');
    }

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class, 'event_id');
    }
}
