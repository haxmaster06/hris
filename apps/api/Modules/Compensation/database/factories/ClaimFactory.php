<?php

declare(strict_types=1);

namespace Modules\Compensation\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Compensation\Models\Claim;
use Modules\Employee\Models\Employee;

class ClaimFactory extends Factory
{
    protected $model = Claim::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 50000, 2000000);
        return [
            'employee_id' => Employee::factory(),
            'claim_number' => 'CLM-' . $this->faker->unique()->numberBetween(10000, 99999),
            'type' => $this->faker->randomElement(['medical', 'reimbursement', 'travel', 'other']),
            'amount' => $amount,
            'approved_amount' => null,
            'claim_date' => now()->subDays(5)->toDateString(),
            'description' => $this->faker->sentence(),
            'receipt_path' => null,
            'status' => 'submitted',
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => null,
            'version' => 1,
        ];
    }
}
