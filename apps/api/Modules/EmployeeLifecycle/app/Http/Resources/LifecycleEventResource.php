<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource;
use Modules\Organization\Http\Resources\PositionResource;
use Modules\Organization\Http\Resources\DepartmentResource;
use Modules\Organization\Http\Resources\BranchResource;
use Modules\Organization\Http\Resources\DivisionResource;
use Modules\Organization\Http\Resources\GradeResource;

class LifecycleEventResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'event_type' => $this->event_type,
            'effective_date' => $this->effective_date?->toDateString(),
            
            // From fields
            'from_position_id' => $this->from_position_id,
            'from_position' => new PositionResource($this->whenLoaded('fromPosition')),
            'from_department_id' => $this->from_department_id,
            'from_department' => new DepartmentResource($this->whenLoaded('fromDepartment')),
            'from_branch_id' => $this->from_branch_id,
            'from_branch' => new BranchResource($this->whenLoaded('fromBranch')),
            'from_division_id' => $this->from_division_id,
            'from_division' => new DivisionResource($this->whenLoaded('fromDivision')),
            'from_grade_id' => $this->from_grade_id,
            'from_grade' => new GradeResource($this->whenLoaded('fromGrade')),
            'from_status' => $this->from_status,
            'from_salary' => $this->from_salary,
            
            // To fields
            'to_position_id' => $this->to_position_id,
            'to_position' => new PositionResource($this->whenLoaded('toPosition')),
            'to_department_id' => $this->to_department_id,
            'to_department' => new DepartmentResource($this->whenLoaded('toDepartment')),
            'to_branch_id' => $this->to_branch_id,
            'to_branch' => new BranchResource($this->whenLoaded('toBranch')),
            'to_division_id' => $this->to_division_id,
            'to_division' => new DivisionResource($this->whenLoaded('toDivision')),
            'to_grade_id' => $this->to_grade_id,
            'to_grade' => new GradeResource($this->whenLoaded('toGrade')),
            'to_status' => $this->to_status,
            'to_salary' => $this->to_salary,
            
            'reason' => $this->reason,
            'notes' => $this->notes,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toISOString(),
            'document_path' => $this->document_path,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
