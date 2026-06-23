<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PositionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'department_id' => $this->department_id,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'division_id' => $this->division_id,
            'division' => new DivisionResource($this->whenLoaded('division')),
            'name' => $this->name,
            'code' => $this->code,
            'job_description' => $this->job_description,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
