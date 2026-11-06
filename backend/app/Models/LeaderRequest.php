<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaderRequest extends Model
{
    public $timestamps = false;
    protected $table = 'leader_requests';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'user_id', 'club_name', 'category', 'reason', 'document_name', 'status', 'created_at', 'reviewed_at'];
    protected $casts = ['created_at' => 'datetime', 'reviewed_at' => 'datetime'];
}
