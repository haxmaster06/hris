<?php

declare(strict_types=1);

namespace Modules\Training\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnrollParticipantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'training_session_id' => ['required', 'uuid', 'exists:training_sessions,id'],
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
