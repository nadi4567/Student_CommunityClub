<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    public $timestamps = false;
    protected $table = 'announcements';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'club_id', 'title', 'body', 'created_at'];
    protected $casts = ['created_at' => 'datetime'];
}
