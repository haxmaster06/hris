<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Organization\Http\Resources\PositionResource;

class CertificationRequirementResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'position_id' => $this->position_id,
            'position' => new PositionResource($this->whenLoaded('position')),
            'certification_id' => $this->certification_id,
            'certification' => new CertificationResource($this->whenLoaded('certification')),
            'is_mandatory' => $this->is_mandatory,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
