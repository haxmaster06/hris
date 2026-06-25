<?php

declare(strict_types=1);

namespace Modules\Payroll\Tests\Unit;

use Tests\TestCase;
use Modules\Payroll\Services\TaxCalculationService;

class TaxCalculationTest extends TestCase
{
    private TaxCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TaxCalculationService();
    }

    public function test_get_ter_category(): void
    {
        $this->assertEquals('A', $this->service->getTerCategory('TK/0'));
        $this->assertEquals('A', $this->service->getTerCategory('K/0'));
        $this->assertEquals('B', $this->service->getTerCategory('K/1'));
        $this->assertEquals('B', $this->service->getTerCategory('TK/2'));
        $this->assertEquals('C', $this->service->getTerCategory('K/3'));
    }

    public function test_get_ter_rate(): void
    {
        // Kategori A, bruto <= 5.4jt -> 0%
        $this->assertEquals(0.0, $this->service->getTerRate(5000000.00, 'A'));
        // Kategori A, 6.3jt < bruto <= 6.75jt -> 1%
        $this->assertEquals(0.01, $this->service->getTerRate(6500000.00, 'A'));
        // Kategori A, 18.35jt < bruto <= 20.35jt -> 4%
        $this->assertEquals(0.04, $this->service->getTerRate(20000000.00, 'A'));
    }

    public function test_gross_and_nett_tax_calculation(): void
    {
        $gross = 6500000.00; // Category A, rate 1%
        
        $result = $this->service->calculate($gross, 'TK/0', 'gross');
        $this->assertEquals(65000.00, $result['tax_amount']);
        $this->assertEquals(0.0, $result['tax_allowance']);

        $resultNett = $this->service->calculate($gross, 'TK/0', 'nett');
        $this->assertEquals(65000.00, $resultNett['tax_amount']);
        $this->assertEquals(0.0, $resultNett['tax_allowance']);
    }

    public function test_gross_up_tax_calculation(): void
    {
        $grossWithoutTax = 6500000.00; // Category A, rate 1%
        // Target: gross + taxAllowance.
        // Jika taxAllowance = 65000, gross = 6565000, rate = 1% -> tax = 65650.
        // Konvergensi akan menyesuaikan tunjangan pajak sehingga:
        // taxAmount = taxAllowance.
        
        $result = $this->service->calculate($grossWithoutTax, 'TK/0', 'gross_up');
        
        $this->assertGreaterThan(0.0, $result['tax_allowance']);
        $this->assertEquals($result['tax_amount'], $result['tax_allowance']);
        
        // Pengecekan hitungan rate:
        $finalGross = $grossWithoutTax + $result['tax_allowance'];
        $rate = $this->service->getTerRate($finalGross, 'A');
        
        $this->assertEquals(round($finalGross * $rate, 2), $result['tax_amount']);
    }
}
