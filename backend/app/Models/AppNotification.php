<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    public $timestamps = false;
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'user_id', 'title', 'message', 'is_read', 'created_at'];
    protected $casts = ['created_at' => 'datetime', 'is_read' => 'boolean'];
}
