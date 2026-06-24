<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateRequirementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'position_id' => ['required', 'uuid', 'exists:positions,id'],
            'certification_id' => ['required', 'uuid', 'exists:certifications,id'],
            'is_mandatory' => ['nullable', 'boolean'],
        ];
    }
}
