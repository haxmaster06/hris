<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_application_id' => ['required', 'uuid', 'exists:job_applications,id'],
            'interview_date' => ['required', 'date_format:Y-m-d H:i:s'],
            'interviewer_id' => ['required', 'uuid', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'score' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status' => ['nullable', 'string', 'in:scheduled,completed,cancelled'],
        ];
    }
}
