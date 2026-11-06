<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    protected $table = 'event_registrations';
    public $timestamps = false;
    protected $fillable = ['event_id', 'user_id'];
    protected $primaryKey = null;
    public $incrementing = false;
}
