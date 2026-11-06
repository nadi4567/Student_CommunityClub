<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    public $timestamps = false;
    protected $table = 'reports';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'reporter_id', 'target_type', 'target_id', 'reason', 'status', 'created_at'];
    protected $casts = ['created_at' => 'datetime'];
}
