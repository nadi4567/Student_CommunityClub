<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipRequest extends Model
{
    public $timestamps = false;
    protected $table = 'membership_requests';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'club_id', 'user_id', 'status', 'created_at'];
    protected $casts = ['created_at' => 'datetime'];
}
