<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Requests\Division;

use Illuminate\Foundation\Http\FormRequest;

class CreateDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id' => ['required', 'uuid', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:divisions,code'],
        ];
    }
}
