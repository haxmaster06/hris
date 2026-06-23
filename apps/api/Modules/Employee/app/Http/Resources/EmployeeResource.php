<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Organization\Http\Resources\CompanyResource;
use Modules\Organization\Http\Resources\BranchResource;
use Modules\Organization\Http\Resources\DepartmentResource;
use Modules\Organization\Http\Resources\PositionResource;

class EmployeeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'company_id' => $this->company_id,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'branch_id' => $this->branch_id,
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'department_id' => $this->department_id,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'position_id' => $this->position_id,
            'position' => new PositionResource($this->whenLoaded('position')),
            'employee_number' => $this->employee_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->toDateString(),
            'join_date' => $this->join_date?->toDateString(),
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
