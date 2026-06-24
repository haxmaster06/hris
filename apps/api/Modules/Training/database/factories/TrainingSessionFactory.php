<?php

declare(strict_types=1);

namespace Modules\Training\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Training\Models\Training;
use Modules\Training\Models\TrainingSession;

class TrainingSessionFactory extends Factory
{
    protected $model = TrainingSession::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('+1 week', '+1 month');
        $endDate = (clone $startDate)->modify('+' . $this->faker->numberBetween(1, 5) . ' days');

        return [
            'training_id' => Training::factory(),
            'trainer' => $this->faker->name(),
            'venue' => $this->faker->company() . ' Room ' . $this->faker->numberBetween(1, 10),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => 'Scheduled',
            'version' => 1,
        ];
    }
}
