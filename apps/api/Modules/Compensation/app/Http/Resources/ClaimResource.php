<?php

declare(strict_types=1);

namespace Modules\Compensation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClaimResource extends JsonResource
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
            'claim_number' => $this->claim_number,
            'type' => $this->type,
            'amount' => $this->amount,
            'approved_amount' => $this->approved_amount,
            'claim_date' => $this->claim_date?->toDateString(),
            'description' => $this->description,
            'receipt_path' => $this->receipt_path,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
