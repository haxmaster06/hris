<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollRunDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payroll_run_id' => $this->payroll_run_id,
            'payroll_component_id' => $this->payroll_component_id,
            'component_name' => $this->component_name,
            'type' => $this->type,
            'amount' => $this->amount,
            'is_taxable' => $this->is_taxable,
            'notes' => $this->notes,
            'sort_order' => $this->sort_order,
        ];
    }
}
