<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource;

class EmployeeShiftResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'shift_id' => $this->shift_id,
            'shift' => new ShiftResource($this->whenLoaded('shift')),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
