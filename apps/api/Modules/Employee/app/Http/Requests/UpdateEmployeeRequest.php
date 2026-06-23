<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee');

        return [
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'company_id' => ['required', 'uuid', 'exists:companies,id'],
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'department_id' => ['required', 'uuid', 'exists:departments,id'],
            'position_id' => ['required', 'uuid', 'exists:positions,id'],
            'employee_number' => ['required', 'string', 'max:50', 'unique:employees,employee_number,' . $employeeId . ',id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', 'string', 'in:male,female'],
            'birth_date' => ['required', 'date', 'before:today'],
            'join_date' => ['required', 'date'],
            'status' => ['required', 'string', 'in:applicant,probation,contract,permanent,resigned,retired,terminated'],
        ];
    }
}
