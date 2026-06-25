<?php

declare(strict_types=1);

namespace Modules\Payroll\Services;

class BPJSCalculationService
{
    // Standar batas atas (ceiling) BPJS di Indonesia (tahun 2024/2025)
    private const JP_SALARY_CEILING = 10042300.00; // Batas atas Jaminan Pensiun
    private const KES_SALARY_CEILING = 12000000.00; // Batas atas BPJS Kesehatan

    /**
     * Calculate BPJS components based on salary.
     */
    public function calculate(float $salary): array
    {
        // 1. BPJS Kesehatan
        $kesBaseSalary = min($salary, self::KES_SALARY_CEILING);
        $bpjsKesEmployee = $kesBaseSalary * 0.01;
        $bpjsKesCompany = $kesBaseSalary * 0.04;

        // 2. BPJS Ketenagakerjaan - JHT (Jaminan Hari Tua)
        $bpjsJhtEmployee = $salary * 0.02;
        $bpjsJhtCompany = $salary * 0.037;

        // 3. BPJS Ketenagakerjaan - JP (Jaminan Pensiun)
        $jpBaseSalary = min($salary, self::JP_SALARY_CEILING);
        $bpjsJpEmployee = $jpBaseSalary * 0.01;
        $bpjsJpCompany = $jpBaseSalary * 0.02;

        // 4. BPJS Ketenagakerjaan - JKK (Jaminan Kecelakaan Kerja) & JKM (Jaminan Kematian)
        $bpjsJkkCompany = $salary * 0.0024; // Contoh rate JKK terendah/umum 0.24%
        $bpjsJkmCompany = $salary * 0.003; // Rate JKM umum 0.3%

        $totalTkEmployee = $bpjsJhtEmployee + $bpjsJpEmployee;
        $totalTkCompany = $bpjsJhtCompany + $bpjsJpCompany + $bpjsJkkCompany + $bpjsJkmCompany;

        return [
            'bpjs_tk_employee' => round($totalTkEmployee, 2),
            'bpjs_tk_company' => round($totalTkCompany, 2),
            'bpjs_kes_employee' => round($bpjsKesEmployee, 2),
            'bpjs_kes_company' => round($bpjsKesCompany, 2),
            
            // Rincian untuk detail payslip
            'details' => [
                'jht_employee' => round($bpjsJhtEmployee, 2),
                'jht_company' => round($bpjsJhtCompany, 2),
                'jp_employee' => round($bpjsJpEmployee, 2),
                'jp_company' => round($bpjsJpCompany, 2),
                'jkk_company' => round($bpjsJkkCompany, 2),
                'jkm_company' => round($bpjsJkmCompany, 2),
                'kes_employee' => round($bpjsKesEmployee, 2),
                'kes_company' => round($bpjsKesCompany, 2),
            ]
        ];
    }
}
