<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource;

class AttendanceLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'date' => $this->date?->toDateString(),
            'check_in' => $this->check_in,
            'check_out' => $this->check_out,
            'check_in_ip' => $this->check_in_ip,
            'check_out_ip' => $this->check_out_ip,
            'status' => $this->status,
            'work_hours' => $this->work_hours !== null ? (float) $this->work_hours : 0.0,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
