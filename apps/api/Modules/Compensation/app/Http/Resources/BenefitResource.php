<?php

declare(strict_types=1);

namespace Modules\Compensation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BenefitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'provider' => $this->provider,
            'company_contribution' => $this->company_contribution,
            'employee_contribution' => $this->employee_contribution,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
