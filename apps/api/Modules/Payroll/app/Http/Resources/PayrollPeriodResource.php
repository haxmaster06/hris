<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollPeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'month' => $this->month,
            'year' => $this->year,
            'name' => $this->name,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'cut_off_date' => $this->cut_off_date?->toDateString(),
            'payment_date' => $this->payment_date?->toDateString(),
            'status' => $this->status,
            'processed_at' => $this->processed_at,
            'processed_by' => $this->processed_by,
            'approved_at' => $this->approved_at,
            'approved_by' => $this->approved_by,
            'locked_at' => $this->locked_at,
            'locked_by' => $this->locked_by,
            'notes' => $this->notes,
            'version' => $this->version,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
