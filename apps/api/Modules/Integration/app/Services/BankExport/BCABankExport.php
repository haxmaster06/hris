<?php

declare(strict_types=1);

namespace Modules\Integration\Services\BankExport;

use Modules\Integration\Contracts\BankExportInterface;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Payroll\Models\EmployeeSalary;

class BCABankExport implements BankExportInterface
{
    public function getBankName(): string
    {
        return 'BCA';
    }

    public function getFormat(): string
    {
        return 'csv';
    }

    public function generateFile(PayrollPeriod $period): string
    {
        $headers = ['Account Number', 'Beneficiary Name', 'Amount', 'Currency', 'Remark'];
        $rows = [implode(',', $headers)];

        foreach ($period->payrollRuns as $run) {
            $salary = EmployeeSalary::where('employee_id', $run->employee_id)->first();
            $account = $salary?->bank_account ?? '';
            $holder = $salary?->bank_holder_name ?? ($run->employee->first_name . ' ' . ($run->employee->last_name ?? ''));
            $amount = round((float) $run->take_home_pay, 2);

            $rows[] = sprintf(
                '"%s","%s",%f,"IDR","Payroll %s %d"',
                str_replace('"', '""', $account),
                str_replace('"', '""', $holder),
                $amount,
                $period->name ?: 'Salary',
                $period->year
            );
        }

        return implode("\n", $rows);
    }
}
