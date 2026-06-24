<?php

declare(strict_types=1);

namespace Modules\Training\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource;

class TrainingParticipantResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'training_session_id' => $this->training_session_id,
            'session' => new TrainingSessionResource($this->whenLoaded('session')),
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'attendance_status' => $this->attendance_status,
            'result_status' => $this->result_status,
            'score' => $this->score,
            'remarks' => $this->remarks,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
