<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InterviewResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'job_application_id' => $this->job_application_id,
            'application' => new JobApplicationResource($this->whenLoaded('application')),
            'interview_date' => $this->interview_date?->toISOString(),
            'interviewer_id' => $this->interviewer_id,
            'notes' => $this->notes,
            'score' => $this->score,
            'status' => $this->status,
            'evaluation' => $this->whenLoaded('evaluation'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
