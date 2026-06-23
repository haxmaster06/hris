<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Requests\Grade;

use Illuminate\Foundation\Http\FormRequest;

class CreateGradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:grades,code'],
            'level' => ['required', 'integer', 'min:1'],
            'min_salary' => ['required', 'numeric', 'min:0'],
            'max_salary' => ['required', 'numeric', 'gte:min_salary'],
        ];
    }
}
