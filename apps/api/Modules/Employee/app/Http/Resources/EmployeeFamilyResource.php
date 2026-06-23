<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeFamilyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'name' => $this->name,
            'relationship' => $this->relationship,
            'birth_date' => $this->birth_date?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
