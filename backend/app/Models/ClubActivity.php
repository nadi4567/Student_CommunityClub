<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubActivity extends Model
{
    protected $table = 'club_activities';
    public $timestamps = false;
    protected $fillable = ['club_id', 'activity'];
    protected $primaryKey = null;
    public $incrementing = false;
}