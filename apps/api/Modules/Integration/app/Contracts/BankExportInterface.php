<?php

declare(strict_types=1);

namespace Modules\Integration\Contracts;

use Modules\Payroll\Models\PayrollPeriod;

interface BankExportInterface
{
    public function generateFile(PayrollPeriod $period): string; // returns content of the file
    public function getFormat(): string; // 'txt', 'csv', 'xlsx'
    public function getBankName(): string;
}
