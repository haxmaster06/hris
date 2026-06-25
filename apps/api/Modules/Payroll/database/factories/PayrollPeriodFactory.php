<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Payroll\Models\PayrollPeriod;

class PayrollPeriodFactory extends Factory
{
    protected $model = PayrollPeriod::class;

    public function definition(): array
    {
        $month = $this->faker->numberBetween(1, 12);
        $year = $this->faker->numberBetween(2025, 2027);
        
        $start_date = date('Y-m-d', strtotime("{$year}-{$month}-01"));
        $end_date = date('Y-m-d', strtotime("{$year}-{$month}-25"));
        
        return [
            'month' => $month,
            'year' => $year,
            'name' => date('F Y', strtotime("{$year}-{$month}-01")),
            'start_date' => $start_date,
            'end_date' => $end_date,
            'cut_off_date' => $end_date,
            'status' => 'draft',
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
