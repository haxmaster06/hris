<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeLoanResource extends JsonResource
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
            'loan_number' => $this->loan_number,
            'principal_amount' => $this->principal_amount,
            'remaining_amount' => $this->remaining_amount,
            'installment_amount' => $this->installment_amount,
            'total_installments' => $this->total_installments,
            'paid_installments' => $this->paid_installments,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'reason' => $this->reason,
            'approved_by' => $this->approved_by,
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
