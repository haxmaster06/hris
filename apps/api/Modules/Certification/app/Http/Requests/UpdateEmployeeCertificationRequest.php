<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeCertificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'certification_id' => ['nullable', 'uuid', 'exists:certifications,id'],
            'certificate_number' => ['nullable', 'string', 'max:255'],
            'issue_date' => ['nullable', 'date'],
            'expired_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // Max 5MB
            'status' => ['nullable', 'string', 'in:Active,Expired,Pending_Renewal'],
        ];
    }
}
