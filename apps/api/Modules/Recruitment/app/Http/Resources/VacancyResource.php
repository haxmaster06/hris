<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Organization\Http\Resources\CompanyResource;
use Modules\Organization\Http\Resources\BranchResource;
use Modules\Organization\Http\Resources\DepartmentResource;
use Modules\Organization\Http\Resources\PositionResource;

class VacancyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'department_id' => $this->department_id,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'position_id' => $this->position_id,
            'position' => new PositionResource($this->whenLoaded('position')),
            'title' => $this->title,
            'description' => $this->description,
            'requirements' => $this->requirements,
            'slots' => $this->slots,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
