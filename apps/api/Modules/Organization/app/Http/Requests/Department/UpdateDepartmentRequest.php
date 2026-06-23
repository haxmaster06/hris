<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Requests\Department;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department');

        return [
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'parent_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:departments,code,' . $departmentId . ',id'],
        ];
    }
}
