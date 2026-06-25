<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCostCenterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $costCenterId = $this->route('cost_center');

        return [
            'code' => ['required', 'string', 'max:20', 'unique:cost_centers,code,' . $costCenterId . ',id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'company_id' => ['nullable', 'uuid', 'exists:companies,id'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
