<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Payroll\Models\PayrollRun;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Employee\Models\Employee;

class PayrollRunFactory extends Factory
{
    protected $model = PayrollRun::class;

    public function definition(): array
    {
        $basic = $this->faker->randomFloat(2, 4000000, 15000000);
        $tax = $basic * 0.05;
        $bpjs_tk = $basic * 0.03;
        $bpjs_kes = $basic * 0.01;
        $deductions = $tax + $bpjs_tk + $bpjs_kes;
        $net = $basic - $deductions;

        return [
            'payroll_period_id' => PayrollPeriod::factory(),
            'employee_id' => Employee::factory(),
            'basic_salary' => $basic,
            'total_earnings' => $basic,
            'total_deductions' => $deductions,
            'gross_salary' => $basic,
            'tax_amount' => $tax,
            'bpjs_tk_employee' => $bpjs_tk,
            'bpjs_tk_company' => $basic * 0.05,
            'bpjs_kes_employee' => $bpjs_kes,
            'bpjs_kes_company' => $basic * 0.04,
            'net_salary' => $net,
            'take_home_pay' => $net,
            'tax_method' => 'gross',
            'working_days' => 20,
            'present_days' => 20,
            'absent_days' => 0,
            'late_count' => 0,
            'overtime_hours' => 0,
            'overtime_amount' => 0,
            'version' => 1,
        ];
    }
}
