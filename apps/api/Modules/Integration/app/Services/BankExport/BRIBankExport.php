<?php

declare(strict_types=1);

namespace Modules\Integration\Services\BankExport;

use Modules\Integration\Contracts\BankExportInterface;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Payroll\Models\EmployeeSalary;

class BRIBankExport implements BankExportInterface
{
    public function getBankName(): string
    {
        return 'BRI';
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
            $account = str_pad($salary?->bank_account ?? '', 15, '0', STR_PAD_LEFT);
            $holder = str_pad($salary?->bank_holder_name ?? ($run->employee->first_name . ' ' . ($run->employee->last_name ?? '')), 30, ' ', STR_PAD_RIGHT);
            $amount = str_pad(number_format((float) $run->take_home_pay, 0, '', ''), 12, '0', STR_PAD_LEFT);

            $lines[] = "{$account}|{$holder}|{$amount}";
        }

        return implode("\n", $lines);
    }
}
