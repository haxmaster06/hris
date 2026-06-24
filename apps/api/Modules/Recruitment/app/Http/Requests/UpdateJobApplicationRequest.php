<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vacancy_id' => ['sometimes', 'uuid', 'exists:vacancies,id'],
            'candidate_id' => ['sometimes', 'uuid', 'exists:candidates,id'],
            'status' => ['sometimes', 'string', 'in:applied,screening,interview,assessment,offering,hiring,hired,rejected'],
            'applied_date' => ['sometimes', 'date'],
        ];
    }
}
