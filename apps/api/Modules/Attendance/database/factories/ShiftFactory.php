<?php

declare(strict_types=1);

namespace Modules\Attendance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Attendance\Models\Shift;

class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        return [
            'name' => 'Regular Shift',
            'code' => $this->faker->unique()->lexify('SH-???'),
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'late_tolerance' => 15,
        ];
    }
}
