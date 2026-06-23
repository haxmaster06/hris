<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource;

class LeaveBalanceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'leave_type_id' => $this->leave_type_id,
            'leave_type' => new LeaveTypeResource($this->whenLoaded('leaveType')),
            'year' => $this->year,
            'entitled' => $this->entitled,
            'used' => $this->used,
            'pending' => $this->pending,
            'remaining' => $this->remaining,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
