<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLifecycleEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'event_type' => ['required', 'string', 'in:promotion,mutation,demotion,resignation,termination,retirement,contract_renewal,status_change'],
            'effective_date' => ['required', 'date'],
            'to_position_id' => ['nullable', 'uuid', 'exists:positions,id'],
            'to_department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'to_branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'to_division_id' => ['nullable', 'uuid', 'exists:divisions,id'],
            'to_grade_id' => ['nullable', 'uuid', 'exists:grades,id'],
            'to_status' => ['nullable', 'string', 'in:applicant,probation,contract,permanent,resigned,retired,terminated'],
            'to_salary' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'document_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
