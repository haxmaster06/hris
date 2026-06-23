<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmployeeShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'shift_id' => ['required', 'uuid', 'exists:shifts,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }
}
