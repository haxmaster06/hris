<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payroll_period_id' => $this->payroll_period_id,
            'payroll_period' => new PayrollPeriodResource($this->whenLoaded('payrollPeriod')),
            'employee_id' => $this->employee_id,
            'employee' => $this->relationLoaded('employee') ? [
                'id' => $this->employee->id,
                'first_name' => $this->employee->first_name,
                'last_name' => $this->employee->last_name,
                'employee_code' => $this->employee->employee_code,
            ] : null,
            'basic_salary' => $this->basic_salary,
            'total_earnings' => $this->total_earnings,
            'total_deductions' => $this->total_deductions,
            'gross_salary' => $this->gross_salary,
            'tax_amount' => $this->tax_amount,
            'bpjs_tk_employee' => $this->bpjs_tk_employee,
            'bpjs_tk_company' => $this->bpjs_tk_company,
            'bpjs_kes_employee' => $this->bpjs_kes_employee,
            'bpjs_kes_company' => $this->bpjs_kes_company,
            'net_salary' => $this->net_salary,
            'take_home_pay' => $this->take_home_pay,
            'tax_method' => $this->tax_method,
            'working_days' => $this->working_days,
            'present_days' => $this->present_days,
            'absent_days' => $this->absent_days,
            'late_count' => $this->late_count,
            'overtime_hours' => $this->overtime_hours,
            'overtime_amount' => $this->overtime_amount,
            'details' => PayrollRunDetailResource::collection($this->whenLoaded('payrollRunDetails')),
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
