<?php

declare(strict_types=1);

namespace Modules\Recruitment\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Recruitment\Models\Interview;
use Modules\Recruitment\Models\JobApplication;
use App\Models\User;

class InterviewFactory extends Factory
{
    protected $model = Interview::class;

    public function definition(): array
    {
        return [
            'job_application_id' => JobApplication::factory(),
            'interview_date' => $this->faker->dateTimeBetween('now', '+2 weeks')->format('Y-m-d H:i:s'),
            'interviewer_id' => User::factory(),
            'notes' => $this->faker->sentence(),
            'score' => $this->faker->numberBetween(60, 100),
            'status' => 'scheduled',
        ];
    }
}
