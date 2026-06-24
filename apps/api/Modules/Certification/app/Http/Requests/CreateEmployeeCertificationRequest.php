<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateEmployeeCertificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'certification_id' => ['required', 'uuid', 'exists:certifications,id'],
            'certificate_number' => ['required', 'string', 'max:255'],
            'issue_date' => ['required', 'date'],
            'expired_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // Max 5MB
        ];
    }
}
