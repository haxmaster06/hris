<?php

declare(strict_types=1);

namespace Modules\Compensation\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Compensation\Models\Benefit;

class BenefitFactory extends Factory
{
    protected $model = Benefit::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'type' => $this->faker->randomElement(['health_insurance', 'bpjs', 'allowance', 'other']),
            'provider' => $this->faker->company(),
            'company_contribution' => $this->faker->randomFloat(2, 100000, 1000000),
            'employee_contribution' => $this->faker->randomFloat(2, 10000, 200000),
            'description' => $this->faker->sentence(),
            'is_active' => true,
            'version' => 1,
        ];
    }
}
