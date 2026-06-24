<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vacancy_id' => ['required', 'uuid', 'exists:vacancies,id'],
            'candidate_id' => ['required', 'uuid', 'exists:candidates,id'],
            'status' => ['nullable', 'string', 'in:applied,screening,interview,assessment,offering,hiring,hired,rejected'],
            'applied_date' => ['nullable', 'date'],
        ];
    }
}
