<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class HiringApprovalResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'job_application_id' => $this->job_application_id,
            'application' => new JobApplicationResource($this->whenLoaded('application')),
            'approver_id' => $this->approver_id,
            'stage' => $this->stage,
            'status' => $this->status,
            'comments' => $this->comments,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
