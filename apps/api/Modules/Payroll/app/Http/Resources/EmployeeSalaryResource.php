<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource; // wait, let's check if EmployeeResource exists or if we should format employee manually.
// Let's format employee manually or check if it can just return employee basic info

class EmployeeSalaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => $this->relationLoaded('employee') ? [
                'id' => $this->employee->id,
                'first_name' => $this->employee->first_name,
                'last_name' => $this->employee->last_name,
                'employee_code' => $this->employee->employee_code,
            ] : null,
            'basic_salary' => $this->basic_salary,
            'tax_method' => $this->tax_method,
            'tax_status' => $this->tax_status,
            'bpjs_class' => $this->bpjs_class,
            'bank_name' => $this->bank_name,
            'bank_account' => $this->bank_account,
            'bank_holder_name' => $this->bank_holder_name,
            'effective_date' => $this->effective_date?->toDateString(),
            'notes' => $this->notes,
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
