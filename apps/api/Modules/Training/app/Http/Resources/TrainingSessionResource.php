<?php

declare(strict_types=1);

namespace Modules\Training\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TrainingSessionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'training_id' => $this->training_id,
            'training' => new TrainingResource($this->whenLoaded('training')),
            'trainer' => $this->trainer,
            'venue' => $this->venue,
            'start_date' => $this->start_date?->toISOString(),
            'end_date' => $this->end_date?->toISOString(),
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
