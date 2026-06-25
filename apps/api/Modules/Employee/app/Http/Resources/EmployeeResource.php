<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Organization\Http\Resources\CompanyResource;
use Modules\Organization\Http\Resources\BranchResource;
use Modules\Organization\Http\Resources\DepartmentResource;
use Modules\Organization\Http\Resources\PositionResource;
use Modules\Organization\Http\Resources\DivisionResource;
use Modules\Organization\Http\Resources\GradeResource;

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
            'division_id' => $this->division_id,
            'division' => new DivisionResource($this->whenLoaded('division')),
            'position_id' => $this->position_id,
            'position' => new PositionResource($this->whenLoaded('position')),
            'grade_id' => $this->grade_id,
            'grade' => new GradeResource($this->whenLoaded('grade')),
            'reports_to' => $this->reports_to,
            'supervisor' => new EmployeeResource($this->whenLoaded('supervisor')),
            'subordinates' => EmployeeResource::collection($this->whenLoaded('subordinates')),
            'employee_number' => $this->employee_number,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->toDateString(),
            'join_date' => $this->join_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'phone' => $this->phone,
            'email' => $this->email,
            'id_number' => $this->id_number,
            'tax_number' => $this->tax_number,
            'blood_type' => $this->blood_type,
            'religion' => $this->religion,
            'marital_status' => $this->marital_status,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'status' => $this->status,
            'employment_type' => $this->employment_type,
            'photo_url' => $this->photo_url,
            'emergency_contacts' => $this->when($this->relationLoaded('emergencyContacts'), function () {
                return $this->emergencyContacts->map(function ($contact) {
                    return [
                        'id' => $contact->id,
                        'name' => $contact->name,
                        'relationship' => $contact->relationship,
                        'phone' => $contact->phone,
                        'email' => $contact->email,
                        'address' => $contact->address,
                        'is_primary' => $contact->is_primary,
                    ];
                });
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
