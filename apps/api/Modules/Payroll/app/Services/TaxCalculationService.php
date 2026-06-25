<?php

declare(strict_types=1);

namespace Modules\Payroll\Services;

class TaxCalculationService
{
    /**
     * Tentukan Kategori TER berdasarkan status PTKP.
     * Kategori A: TK/0, TK/1, K/0
     * Kategori B: TK/2, TK/3, K/1, K/2
     * Kategori C: K/3
     */
    public function getTerCategory(string $taxStatus): string
    {
        $status = strtoupper($taxStatus);
        
        if (in_array($status, ['TK/0', 'TK/1', 'K/0'])) {
            return 'A';
        }
        
        if (in_array($status, ['TK/2', 'TK/3', 'K/1', 'K/2'])) {
            return 'B';
        }
        
        if ($status === 'K/3') {
            return 'C';
        }
        
        return 'A'; // Default fallback
    }

    /**
     * Dapatkan persentase tarif TER berdasarkan kategori dan penghasilan bruto bulanan.
     */
    public function getTerRate(float $gross, string $category): float
    {
        if ($category === 'A') {
            if ($gross <= 5400000) return 0.0;
            if ($gross <= 5650000) return 0.0025;
            if ($gross <= 5950000) return 0.005;
            if ($gross <= 6300000) return 0.0075;
            if ($gross <= 6750000) return 0.01;
            if ($gross <= 7500000) return 0.0125;
            if ($gross <= 8550000) return 0.015;
            if ($gross <= 9650000) return 0.0175;
            if ($gross <= 10950000) return 0.02;
            if ($gross <= 12550000) return 0.0225;
            if ($gross <= 14350000) return 0.025;
            if ($gross <= 16350000) return 0.03;
            if ($gross <= 18350000) return 0.035;
            if ($gross <= 20350000) return 0.04;
            if ($gross <= 22350000) return 0.05;
            if ($gross <= 24350000) return 0.06;
            if ($gross <= 26350000) return 0.07;
            if ($gross <= 28350000) return 0.08;
            if ($gross <= 30350000) return 0.09;
            if ($gross <= 35000000) return 0.10;
            if ($gross <= 40000000) return 0.11;
            if ($gross <= 50000000) return 0.12;
            if ($gross <= 60000000) return 0.13;
            if ($gross <= 70000000) return 0.14;
            if ($gross <= 80000000) return 0.15;
            if ($gross <= 100000000) return 0.17;
            if ($gross <= 120000000) return 0.19;
            return 0.20; // fallback rate untuk diatas 120jt
        }
        
        if ($category === 'B') {
            if ($gross <= 6200000) return 0.0;
            if ($gross <= 6500000) return 0.0025;
            if ($gross <= 6850000) return 0.005;
            if ($gross <= 7300000) return 0.0075;
            if ($gross <= 7800000) return 0.01;
            if ($gross <= 8500000) return 0.0125;
            if ($gross <= 9450000) return 0.015;
            if ($gross <= 10650000) return 0.0175;
            if ($gross <= 12050000) return 0.02;
            if ($gross <= 13650000) return 0.0225;
            if ($gross <= 15350000) return 0.025;
            if ($gross <= 17350000) return 0.03;
            if ($gross <= 19450000) return 0.035;
            if ($gross <= 21550000) return 0.04;
            if ($gross <= 23650000) return 0.05;
            if ($gross <= 25750000) return 0.06;
            if ($gross <= 27850000) return 0.07;
            if ($gross <= 30000000) return 0.08;
            if ($gross <= 35000000) return 0.09;
            if ($gross <= 40000000) return 0.10;
            if ($gross <= 45000000) return 0.11;
            if ($gross <= 50000000) return 0.12;
            if ($gross <= 55000000) return 0.13;
            if ($gross <= 60000000) return 0.14;
            if ($gross <= 70000000) return 0.15;
            if ($gross <= 80000000) return 0.17;
            if ($gross <= 100000000) return 0.19;
            return 0.20;
        }
        
        if ($category === 'C') {
            if ($gross <= 6600000) return 0.0;
            if ($gross <= 6950000) return 0.0025;
            if ($gross <= 7350000) return 0.005;
            if ($gross <= 7800000) return 0.0075;
            if ($gross <= 8350000) return 0.01;
            if ($gross <= 9050000) return 0.0125;
            if ($gross <= 9850000) return 0.015;
            if ($gross <= 10750000) return 0.0175;
            if ($gross <= 11850000) return 0.02;
            if ($gross <= 13050000) return 0.0225;
            if ($gross <= 14350000) return 0.025;
            if ($gross <= 15750000) return 0.03;
            if ($gross <= 17250000) return 0.035;
            if ($gross <= 18950000) return 0.04;
            if ($gross <= 20750000) return 0.05;
            if ($gross <= 22750000) return 0.06;
            if ($gross <= 24850000) return 0.07;
            if ($gross <= 27050000) return 0.08;
            if ($gross <= 29350000) return 0.09;
            if ($gross <= 31750000) return 0.10;
            if ($gross <= 34250000) return 0.11;
            if ($gross <= 37250000) return 0.12;
            if ($gross <= 40750000) return 0.13;
            if ($gross <= 44750000) return 0.14;
            if ($gross <= 49250000) return 0.15;
            if ($gross <= 54250000) return 0.17;
            if ($gross <= 62250000) return 0.19;
            return 0.20;
        }
        
        return 0.0;
    }

    /**
     * Hitung PPh 21 bulanan berdasarkan metode pajak dan status PTKP.
     * 
     * @param float $grossWithoutTax Total pendapatan bruto sebelum ditambah tunjangan pajak (jika ada)
     * @param string $taxStatus Status PTKP (misal: TK/0, K/1)
     * @param string $taxMethod Metode pajak: gross, nett, gross_up
     * @return array [tax_amount, tax_allowance]
     */
    public function calculate(float $grossWithoutTax, string $taxStatus, string $taxMethod): array
    {
        $category = $this->getTerCategory($taxStatus);
        $method = strtolower($taxMethod);

        if ($method === 'gross' || $method === 'nett') {
            // Gross & Nett: pajak dihitung langsung dari bruto dasar
            $rate = $this->getTerRate($grossWithoutTax, $category);
            $taxAmount = $grossWithoutTax * $rate;
            
            // Pada Nett, perusahaan yang menanggung pajak (tidak mengurangi take-home pay, tapi tidak ada tunjangan pajak yang menambah bruto dasar SPT)
            // Pada Gross, pajak mengurangi take-home pay
            return [
                'tax_amount' => round($taxAmount, 2),
                'tax_allowance' => 0.0
            ];
        }

        if ($method === 'gross_up') {
            // Gross-Up: iterasi konvergensi tunjangan pajak agar netto sama dengan base income
            $taxAllowance = 0.0;
            $maxIterations = 10;
            $tolerance = 0.01;
            
            for ($i = 0; $i < $maxIterations; $i++) {
                $grossForTax = $grossWithoutTax + $taxAllowance;
                $rate = $this->getTerRate($grossForTax, $category);
                $calculatedTax = $grossForTax * $rate;
                
                if (abs($calculatedTax - $taxAllowance) < $tolerance) {
                    $taxAllowance = $calculatedTax;
                    break;
                }
                
                // Gunakan hasil perhitungan langsung untuk konvergensi lebih cepat
                $taxAllowance = $calculatedTax;
            }
            
            $finalGross = $grossWithoutTax + $taxAllowance;
            $rate = $this->getTerRate($finalGross, $category);
            $taxAmount = $finalGross * $rate;

            return [
                'tax_amount' => round($taxAmount, 2),
                'tax_allowance' => round($taxAllowance, 2)
            ];
        }

        return [
            'tax_amount' => 0.0,
            'tax_allowance' => 0.0
        ];
    }
}
