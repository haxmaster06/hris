<?php

declare(strict_types=1);

namespace Modules\Payroll\Tests\Unit;

use Tests\TestCase;
use Modules\Payroll\Services\BPJSCalculationService;

class BPJSCalculationTest extends TestCase
{
    private BPJSCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BPJSCalculationService();
    }

    public function test_bpjs_calculation_within_ceiling(): void
    {
        $salary = 5000000.00; // di bawah ceiling JP (10jt) & Kes (12jt)
        
        $result = $this->service->calculate($salary);

        // BPJS Kes Employee: 1% * 5jt = 50,000
        $this->assertEquals(50000.00, $result['bpjs_kes_employee']);
        // BPJS Kes Company: 4% * 5jt = 200,000
        $this->assertEquals(200000.00, $result['bpjs_kes_company']);

        // JHT Employee: 2% * 5jt = 100,000
        $this->assertEquals(100000.00, $result['details']['jht_employee']);
        // JHT Company: 3.7% * 5jt = 185,000
        $this->assertEquals(185000.00, $result['details']['jht_company']);

        // JP Employee: 1% * 5jt = 50,000
        $this->assertEquals(50000.00, $result['details']['jp_employee']);
        // JP Company: 2% * 5jt = 100,000
        $this->assertEquals(100000.00, $result['details']['jp_company']);
    }

    public function test_bpjs_calculation_above_ceilings(): void
    {
        $salary = 15000000.00; // di atas ceiling JP (10.042.300) & Kes (12.000.000)
        
        $result = $this->service->calculate($salary);

        // BPJS Kes Employee: 1% * 12jt = 120,000 (capped)
        $this->assertEquals(120000.00, $result['bpjs_kes_employee']);
        // BPJS Kes Company: 4% * 12jt = 480,000 (capped)
        $this->assertEquals(480000.00, $result['bpjs_kes_company']);

        // JP Employee: 1% * 10,042,300 = 100,423
        $this->assertEquals(100423.00, $result['details']['jp_employee']);
        // JP Company: 2% * 10,042,300 = 200,846
        $this->assertEquals(200846.00, $result['details']['jp_company']);

        // JHT Employee: 2% * 15jt = 300,000 (tidak ada cap untuk JHT)
        $this->assertEquals(300000.00, $result['details']['jht_employee']);
    }
}
