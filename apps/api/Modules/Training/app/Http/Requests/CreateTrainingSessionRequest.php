<?php

declare(strict_types=1);

namespace Modules\Training\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTrainingSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'training_id' => ['required', 'uuid', 'exists:trainings,id'],
            'trainer' => ['required', 'string', 'max:255'],
            'venue' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'string', 'in:Scheduled,Ongoing,Completed,Cancelled'],
        ];
    }
}
