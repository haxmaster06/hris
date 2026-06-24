<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class JobApplicationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'vacancy_id' => $this->vacancy_id,
            'vacancy' => new VacancyResource($this->whenLoaded('vacancy')),
            'candidate_id' => $this->candidate_id,
            'candidate' => new CandidateResource($this->whenLoaded('candidate')),
            'status' => $this->status,
            'applied_date' => $this->applied_date?->toDateString(),
            'interviews' => InterviewResource::collection($this->whenLoaded('interviews')),
            'approvals' => HiringApprovalResource::collection($this->whenLoaded('approvals')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
