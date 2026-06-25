<?php

declare(strict_types=1);

namespace Modules\Leave\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Leave\Models\Holiday;

class HolidayFactory extends Factory
{
    protected $model = Holiday::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement(['New Year Day', 'Independence Day', 'Labor Day', 'Company Anniversary']),
            'date' => now()->addDays(5)->toDateString(),
            'type' => $this->faker->randomElement(['public', 'company']),
            'is_recurring' => false,
            'description' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
