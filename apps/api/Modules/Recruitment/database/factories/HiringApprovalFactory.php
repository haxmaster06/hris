<?php

declare(strict_types=1);

namespace Modules\Recruitment\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Recruitment\Models\HiringApproval;
use Modules\Recruitment\Models\JobApplication;
use App\Models\User;

class HiringApprovalFactory extends Factory
{
    protected $model = HiringApproval::class;

    public function definition(): array
    {
        return [
            'job_application_id' => JobApplication::factory(),
            'approver_id' => User::factory(),
            'stage' => 'hr',
            'status' => 'pending',
            'comments' => $this->faker->sentence(),
        ];
    }
}
