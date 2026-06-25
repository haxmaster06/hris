<?php

declare(strict_types=1);

namespace Modules\Engagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Engagement\Models\Award;
use Modules\Employee\Models\Employee;

class AwardFactory extends Factory
{
    protected $model = Award::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'title' => $this->faker->randomElement(['Employee of the Month', 'Innovation Award', 'Team Player', 'Service Excellence']),
            'description' => $this->faker->sentence(),
            'category' => $this->faker->randomElement(['employee_of_month', 'innovation', 'teamwork', 'leadership', 'service_excellence']),
            'awarded_date' => now()->toDateString(),
            'awarded_by' => Employee::factory(),
            'certificate_path' => null,
            'version' => 1,
        ];
    }
}
