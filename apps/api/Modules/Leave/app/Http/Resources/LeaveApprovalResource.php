<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class LeaveApprovalResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'leave_request_id' => $this->leave_request_id,
            'approver_id' => $this->approver_id,
            'approver' => $this->relationLoaded('approver') ? [
                'id' => $this->approver?->id,
                'name' => $this->approver?->name,
                'email' => $this->approver?->email,
            ] : null,
            'status' => $this->status,
            'comments' => $this->comments,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
