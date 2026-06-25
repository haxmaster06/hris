<?php

declare(strict_types=1);

namespace Modules\Employee\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Employee\Models\ProfileUpdateRequest;
use Modules\Employee\Models\Employee;

class ProfileUpdateRequestFactory extends Factory
{
    protected $model = ProfileUpdateRequest::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'field_name' => 'phone',
            'old_value' => '12345678',
            'new_value' => '87654321',
            'status' => 'pending',
            'approved_by' => null,
            'comments' => null,
        ];
    }
}
