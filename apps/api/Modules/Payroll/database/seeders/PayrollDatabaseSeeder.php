<?php

declare(strict_types=1);

namespace Modules\Payroll\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Payroll\Models\PayrollComponent;

class PayrollDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $components = [
            ['code' => 'BASIC', 'name' => 'Gaji Pokok', 'type' => 'earning', 'category' => 'basic_salary', 'is_taxable' => true, 'sort_order' => 1],
            ['code' => 'TJAB', 'name' => 'Tunjangan Jabatan', 'type' => 'earning', 'category' => 'fixed_allowance', 'is_taxable' => true, 'sort_order' => 2],
            ['code' => 'TMKN', 'name' => 'Tunjangan Makan', 'type' => 'earning', 'category' => 'variable_allowance', 'is_taxable' => true, 'sort_order' => 3],
            ['code' => 'TTRP', 'name' => 'Tunjangan Transport', 'type' => 'earning', 'category' => 'variable_allowance', 'is_taxable' => true, 'sort_order' => 4],
            ['code' => 'TKOM', 'name' => 'Tunjangan Komunikasi', 'type' => 'earning', 'category' => 'fixed_allowance', 'is_taxable' => true, 'sort_order' => 5],
            ['code' => 'LMBR', 'name' => 'Lembur', 'type' => 'earning', 'category' => 'overtime', 'is_taxable' => true, 'sort_order' => 6],
            ['code' => 'PPH21', 'name' => 'PPh 21', 'type' => 'deduction', 'category' => 'tax', 'is_taxable' => false, 'sort_order' => 7],
            ['code' => 'BPJSTK', 'name' => 'BPJS Ketenagakerjaan', 'type' => 'deduction', 'category' => 'bpjs', 'is_taxable' => false, 'sort_order' => 8],
            ['code' => 'BPJSKS', 'name' => 'BPJS Kesehatan', 'type' => 'deduction', 'category' => 'bpjs', 'is_taxable' => false, 'sort_order' => 9],
            ['code' => 'LOAN', 'name' => 'Cicilan Pinjaman', 'type' => 'deduction', 'category' => 'loan', 'is_taxable' => false, 'sort_order' => 10],
            ['code' => 'PENLT', 'name' => 'Denda/Penalti', 'type' => 'deduction', 'category' => 'penalty', 'is_taxable' => false, 'sort_order' => 11],
        ];

        foreach ($components as $component) {
            PayrollComponent::updateOrCreate(
                ['code' => $component['code']],
                [
                    'name' => $component['name'],
                    'type' => $component['type'],
                    'category' => $component['category'],
                    'is_taxable' => $component['is_taxable'],
                    'sort_order' => $component['sort_order'],
                    'is_active' => true,
                    'version' => 1,
                ]
            );
        }
    }
}
