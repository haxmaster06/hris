<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Payroll\Models\PayrollComponent;

class PayrollComponentFactory extends Factory
{
    protected $model = PayrollComponent::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper($this->faker->unique()->lexify('??????')),
            'name' => $this->faker->words(2, true),
            'type' => $this->faker->randomElement(['earning', 'deduction']),
            'category' => $this->faker->randomElement(['fixed_allowance', 'variable_allowance', 'overtime', 'tax', 'bpjs', 'loan', 'penalty']),
            'is_taxable' => true,
            'is_active' => true,
            'description' => $this->faker->sentence(),
            'sort_order' => $this->faker->numberBetween(0, 100),
            'version' => 1,
        ];
    }
}
