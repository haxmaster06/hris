<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCertificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:certifications,code'],
            'issuer' => ['required', 'string', 'max:255'],
            'validity_period' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
