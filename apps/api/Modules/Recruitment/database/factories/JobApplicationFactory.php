<?php

declare(strict_types=1);

namespace Modules\Recruitment\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Recruitment\Models\JobApplication;
use Modules\Recruitment\Models\Vacancy;
use Modules\Recruitment\Models\Candidate;

class JobApplicationFactory extends Factory
{
    protected $model = JobApplication::class;

    public function definition(): array
    {
        return [
            'vacancy_id' => Vacancy::factory(),
            'candidate_id' => Candidate::factory(),
            'status' => 'applied',
            'applied_date' => $this->faker->date('Y-m-d'),
        ];
    }
}
