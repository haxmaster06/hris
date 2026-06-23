<?php

declare(strict_types=1);

namespace Modules\Leave\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Leave\Models\LeaveType;

class LeaveTypeFactory extends Factory
{
    protected $model = LeaveType::class;

    public function definition(): array
    {
        return [
            'name' => 'Annual Leave',
            'code' => $this->faker->unique()->lexify('LV-???'),
            'default_days' => 12,
            'is_paid' => true,
        ];
    }
}
