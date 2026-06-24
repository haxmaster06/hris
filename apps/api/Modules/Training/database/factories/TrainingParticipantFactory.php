<?php

declare(strict_types=1);

namespace Modules\Training\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Training\Models\TrainingSession;
use Modules\Training\Models\TrainingParticipant;
use Modules\Employee\Models\Employee;

class TrainingParticipantFactory extends Factory
{
    protected $model = TrainingParticipant::class;

    public function definition(): array
    {
        $attendance = ['Pending', 'Attended', 'Absent'];
        $results = ['Pending', 'Pass', 'Fail'];

        return [
            'training_session_id' => TrainingSession::factory(),
            'employee_id' => Employee::factory(),
            'attendance_status' => $this->faker->randomElement($attendance),
            'result_status' => $this->faker->randomElement($results),
            'score' => $this->faker->optional(0.7)->randomFloat(2, 50, 100),
            'remarks' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
