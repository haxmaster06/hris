<?php

declare(strict_types=1);

namespace Modules\Integration\Services\BankExport;

use Modules\Integration\Contracts\BankExportInterface;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Payroll\Models\EmployeeSalary;

class MandiriBankExport implements BankExportInterface
{
    public function getBankName(): string
    {
        return 'Mandiri';
    }

    public function getFormat(): string
    {
        return 'txt';
    }

    public function generateFile(PayrollPeriod $period): string
    {
        $lines = [];

        foreach ($period->payrollRuns as $run) {
            $salary = EmployeeSalary::where('employee_id', $run->employee_id)->first();
            $account = str_pad($salary?->bank_account ?? '', 15, ' ', STR_PAD_RIGHT);
            $holder = str_pad($salary?->bank_holder_name ?? ($run->employee->first_name . ' ' . ($run->employee->last_name ?? '')), 30, ' ', STR_PAD_RIGHT);
            $amount = str_pad(number_format((float) $run->take_home_pay, 2, '', ''), 15, '0', STR_PAD_LEFT);

            $lines[] = "{$account}{$holder}{$amount}";
        }

        return implode("\r\n", $lines);
    }
}
