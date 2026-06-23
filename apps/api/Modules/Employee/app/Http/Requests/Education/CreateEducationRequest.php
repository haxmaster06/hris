<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Requests\Education;

use Illuminate\Foundation\Http\FormRequest;

class CreateEducationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'institution' => ['required', 'string', 'max:255'],
            'degree' => ['required', 'string', 'max:100'],
            'major' => ['required', 'string', 'max:255'],
            'graduation_year' => ['required', 'integer', 'min:1900', 'max:2100'],
        ];
    }
}
