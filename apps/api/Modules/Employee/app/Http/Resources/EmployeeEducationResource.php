<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeEducationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'institution' => $this->institution,
            'degree' => $this->degree,
            'major' => $this->major,
            'graduation_year' => $this->graduation_year,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
