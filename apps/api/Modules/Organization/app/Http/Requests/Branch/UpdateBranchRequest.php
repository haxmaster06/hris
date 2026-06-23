<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Requests\Branch;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $branchId = $this->route('branch');

        return [
            'company_id' => ['required', 'uuid', 'exists:companies,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:branches,code,' . $branchId . ',id'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
        ];
    }
}
