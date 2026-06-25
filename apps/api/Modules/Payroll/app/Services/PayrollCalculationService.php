<?php

declare(strict_types=1);

namespace Modules\Payroll\Services;

use Modules\Employee\Models\Employee;
use Modules\Payroll\Models\PayrollPeriod;
use Modules\Payroll\Models\PayrollRun;
use Modules\Payroll\Models\PayrollRunDetail;
use Modules\Payroll\Models\PayrollComponent;
use Modules\Payroll\Models\EmployeeSalary;
use Modules\Payroll\Models\EmployeeAllowance;
use Modules\Payroll\Models\EmployeeLoan;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Exception;

class PayrollCalculationService
{
    public function __construct(
        private readonly BPJSCalculationService $bpjsService,
        private readonly TaxCalculationService $taxService
    ) {}

    /**
     * Calculate payroll for a specific employee and period.
     */
    public function calculateForEmployee(Employee $employee, PayrollPeriod $period): PayrollRun
    {
        // 1. Get Employee Salary Config
        $salaryConfig = EmployeeSalary::where('employee_id', $employee->id)
            ->where('effective_date', '<=', $period->end_date)
            ->orderBy('effective_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$salaryConfig) {
            throw new Exception("Konfigurasi gaji untuk karyawan {$employee->first_name} {$employee->last_name} tidak ditemukan.");
        }

        $basicSalary = (float) $salaryConfig->basic_salary;
        $taxMethod = $salaryConfig->tax_method;
        $taxStatus = $salaryConfig->tax_status;

        // 2. Fetch Active Allowances
        $allowances = EmployeeAllowance::where('employee_id', $employee->id)
            ->where('is_active', true)
            ->where('effective_date', '<=', $period->end_date)
            ->where(function($q) use ($period) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', $period->start_date);
            })
            ->with('payrollComponent')
            ->get();

        // 3. Fetch Attendance Data (fallback to standard if table doesn't have logs)
        $workingDays = 20;
        $presentDays = 20;
        $absentDays = 0;
        $lateCount = 0;
        $overtimeHours = 0.0;
        $overtimeAmount = 0.0;

        try {
            // Cek log kehadiran riil
            $logs = DB::table('attendance_logs')
                ->where('employee_id', $employee->id)
                ->whereBetween('date', [$period->start_date, $period->end_date])
                ->get();
                
            if ($logs->isNotEmpty()) {
                $presentDays = $logs->whereIn('status', ['present', 'late'])->count();
                $absentDays = $logs->where('status', 'absent')->count();
                $lateCount = $logs->where('status', 'late')->count();
            }
        } catch (Exception $e) {
            // Silent fallback
        }

        // 4. Calculate Earnings List (mulai dengan basic salary)
        $earningsList = [];
        $totalEarnings = $basicSalary;

        // Ambil komponen basic_salary dari DB untuk detail
        $basicComponent = PayrollComponent::where('code', 'BASIC')->first();
        $earningsList[] = [
            'component' => $basicComponent,
            'name' => 'Gaji Pokok',
            'amount' => $basicSalary,
            'is_taxable' => true,
            'type' => 'earning'
        ];

        foreach ($allowances as $allowance) {
            $comp = $allowance->payrollComponent;
            $amt = (float) $allowance->amount;
            $totalEarnings += $amt;
            
            $earningsList[] = [
                'component' => $comp,
                'name' => $comp->name,
                'amount' => $amt,
                'is_taxable' => $comp->is_taxable,
                'type' => 'earning'
            ];
        }

        // 5. Calculate BPJS
        $bpjsResult = $this->bpjsService->calculate($basicSalary);

        // Tambah potongan BPJS Karyawan ke list deductions
        $deductionsList = [];
        $totalDeductions = 0.0;

        $bpjsTkComp = PayrollComponent::where('code', 'BPJSTK')->first();
        $deductionsList[] = [
            'component' => $bpjsTkComp,
            'name' => 'Potongan BPJS Ketenagakerjaan (Karyawan)',
            'amount' => $bpjsResult['bpjs_tk_employee'],
            'is_taxable' => false,
            'type' => 'deduction'
        ];
        $totalDeductions += $bpjsResult['bpjs_tk_employee'];

        $bpjsKsComp = PayrollComponent::where('code', 'BPJSKS')->first();
        $deductionsList[] = [
            'component' => $bpjsKsComp,
            'name' => 'Potongan BPJS Kesehatan (Karyawan)',
            'amount' => $bpjsResult['bpjs_kes_employee'],
            'is_taxable' => false,
            'type' => 'deduction'
        ];
        $totalDeductions += $bpjsResult['bpjs_kes_employee'];

        // 6. Calculate Taxable Income (Bruto)
        $taxableGross = $basicSalary;
        foreach ($allowances as $allowance) {
            if ($allowance->payrollComponent->is_taxable) {
                $taxableGross += (float) $allowance->amount;
            }
        }

        // 7. Calculate Tax PPh 21 (TER)
        $taxResult = $this->taxService->calculate($taxableGross, $taxStatus, $taxMethod);
        $taxAmount = $taxResult['tax_amount'];
        $taxAllowance = $taxResult['tax_allowance'];

        // Jika metode Gross-Up, ada tunjangan pajak yang ditambahkan ke pendapatan
        if ($taxMethod === 'gross_up' && $taxAllowance > 0) {
            $taxAllowComponent = PayrollComponent::where('code', 'TJAB')->first(); // Gunakan kategori fixed atau buat dummy
            $earningsList[] = [
                'component' => $taxAllowComponent,
                'name' => 'Tunjangan Pajak (Gross-Up)',
                'amount' => $taxAllowance,
                'is_taxable' => true,
                'type' => 'earning'
            ];
            $totalEarnings += $taxAllowance;
        }

        // Pajak dimasukkan ke potongan jika metode 'gross' atau 'gross_up' (untuk gross-up bernilai imbang dengan tunjangan pajak)
        // Pada metode 'nett', pajak dibayar perusahaan dan tidak memotong gaji karyawan
        if ($taxMethod === 'gross' || $taxMethod === 'gross_up') {
            $taxComp = PayrollComponent::where('code', 'PPH21')->first();
            $deductionsList[] = [
                'component' => $taxComp,
                'name' => 'Potongan PPh 21',
                'amount' => $taxAmount,
                'is_taxable' => false,
                'type' => 'deduction'
            ];
            $totalDeductions += $taxAmount;
        }

        // 8. Calculate Active Loans (Pinjaman/Kasbon)
        $activeLoans = EmployeeLoan::where('employee_id', $employee->id)
            ->where('status', 'active')
            ->where('remaining_amount', '>', 0)
            ->get();

        foreach ($activeLoans as $loan) {
            $installment = min((float) $loan->installment_amount, (float) $loan->remaining_amount);
            if ($installment > 0) {
                $loanComp = PayrollComponent::where('code', 'LOAN')->first();
                $deductionsList[] = [
                    'component' => $loanComp,
                    'name' => 'Cicilan Pinjaman - ' . $loan->loan_number,
                    'amount' => $installment,
                    'is_taxable' => false,
                    'type' => 'deduction',
                    'meta' => ['loan_id' => $loan->id, 'installment' => $installment]
                ];
                $totalDeductions += $installment;
            }
        }

        // 9. Create/Update PayrollRun Record
        $grossSalary = $totalEarnings;
        $netSalary = $grossSalary - $totalDeductions;
        $takeHomePay = $netSalary;

        return DB::transaction(function() use ($period, $employee, $basicSalary, $totalEarnings, $totalDeductions, $grossSalary, $taxAmount, $bpjsResult, $netSalary, $takeHomePay, $taxMethod, $workingDays, $presentDays, $absentDays, $lateCount, $overtimeHours, $overtimeAmount, $earningsList, $deductionsList) {
            
            // Delete old details if recalculating
            $oldRun = PayrollRun::where('payroll_period_id', $period->id)
                ->where('employee_id', $employee->id)
                ->first();
            if ($oldRun) {
                $oldRun->payrollRunDetails()->delete();
                $oldRun->delete();
            }

            $run = PayrollRun::create([
                'payroll_period_id' => $period->id,
                'employee_id' => $employee->id,
                'basic_salary' => $basicSalary,
                'total_earnings' => $totalEarnings,
                'total_deductions' => $totalDeductions,
                'gross_salary' => $grossSalary,
                'tax_amount' => $taxAmount,
                'bpjs_tk_employee' => $bpjsResult['bpjs_tk_employee'],
                'bpjs_tk_company' => $bpjsResult['bpjs_tk_company'],
                'bpjs_kes_employee' => $bpjsResult['bpjs_kes_employee'],
                'bpjs_kes_company' => $bpjsResult['bpjs_kes_company'],
                'net_salary' => $netSalary,
                'take_home_pay' => $takeHomePay,
                'tax_method' => $taxMethod,
                'working_days' => $workingDays,
                'present_days' => $presentDays,
                'absent_days' => $absentDays,
                'late_count' => $lateCount,
                'overtime_hours' => $overtimeHours,
                'overtime_amount' => $overtimeAmount,
            ]);

            // Save Details (Earnings)
            $sort = 0;
            foreach ($earningsList as $item) {
                PayrollRunDetail::create([
                    'payroll_run_id' => $run->id,
                    'payroll_component_id' => $item['component']?->id,
                    'component_name' => $item['name'],
                    'type' => 'earning',
                    'amount' => $item['amount'],
                    'is_taxable' => $item['is_taxable'],
                    'sort_order' => $sort++,
                ]);
            }

            // Save Details (Deductions)
            foreach ($deductionsList as $item) {
                PayrollRunDetail::create([
                    'payroll_run_id' => $run->id,
                    'payroll_component_id' => $item['component']?->id,
                    'component_name' => $item['name'],
                    'type' => 'deduction',
                    'amount' => $item['amount'],
                    'is_taxable' => $item['is_taxable'],
                    'notes' => isset($item['meta']) ? json_encode($item['meta']) : null,
                    'sort_order' => $sort++,
                ]);
            }

            return $run;
        });
    }

    /**
     * Calculate payroll in batch for all active employees.
     */
    public function calculateForPeriod(PayrollPeriod $period): Collection
    {
        $employees = Employee::where('status', '!=', 'terminated')->get();
        $results = collect();

        foreach ($employees as $employee) {
            try {
                $run = $this->calculateForEmployee($employee, $period);
                $results->push($run);
            } catch (Exception $e) {
                // Lanjutkan pengerjaan batch tapi catat error atau lewati
            }
        }

        return $results;
    }

    /**
     * Lock period and update active loans (mark paid amounts).
     */
    public function lockPeriod(PayrollPeriod $period): void
    {
        DB::transaction(function() use ($period) {
            // Get all payroll runs for the period
            $runs = PayrollRun::where('payroll_period_id', $period->id)->get();

            foreach ($runs as $run) {
                // Find loan deduction details
                $details = PayrollRunDetail::where('payroll_run_id', $run->id)
                    ->where('type', 'deduction')
                    ->whereNotNull('notes')
                    ->get();

                foreach ($details as $detail) {
                    $meta = json_decode($detail->notes, true);
                    if (isset($meta['loan_id'])) {
                        $loan = EmployeeLoan::find($meta['loan_id']);
                        if ($loan) {
                            $loan->paid_installments += 1;
                            $loan->remaining_amount -= (float) $meta['installment'];
                            
                            if ($loan->remaining_amount <= 0 || $loan->paid_installments >= $loan->total_installments) {
                                $loan->status = 'completed';
                            }
                            $loan->save();
                        }
                    }
                }
            }

            $period->status = 'locked';
            $period->locked_at = now();
            $period->locked_by = auth()->id();
            $period->save();
        });
    }
}
