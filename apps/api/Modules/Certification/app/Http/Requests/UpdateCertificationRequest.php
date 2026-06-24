<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCertificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('certification');

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:certifications,code,' . $id],
            'issuer' => ['nullable', 'string', 'max:255'],
            'validity_period' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
