<?php

declare(strict_types=1);

namespace App\Models;

use Stancl\Tenancy\Database\Models\Domain as BaseDomain;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

class Domain extends BaseDomain
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Generate UUID v7 (ordered UUID) for the model primary key.
     */
    public function newUniqueId(): string
    {
        return (string) Str::orderedUuid();
    }
}
