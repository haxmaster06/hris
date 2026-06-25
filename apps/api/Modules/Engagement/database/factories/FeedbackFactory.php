<?php

declare(strict_types=1);

namespace Modules\Engagement\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Engagement\Models\Feedback;
use Modules\Employee\Models\Employee;

class FeedbackFactory extends Factory
{
    protected $model = Feedback::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'type' => $this->faker->randomElement(['suggestion', 'complaint', 'appreciation', 'other']),
            'category' => $this->faker->randomElement(['work_environment', 'management', 'policy', 'compensation', 'other']),
            'content' => $this->faker->paragraph(),
            'is_anonymous' => false,
            'status' => 'submitted',
            'response' => null,
            'responded_by' => null,
            'responded_at' => null,
            'version' => 1,
        ];
    }
}
