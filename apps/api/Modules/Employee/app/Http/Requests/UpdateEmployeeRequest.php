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
            'division_id' => ['nullable', 'uuid', 'exists:divisions,id'],
            'position_id' => ['required', 'uuid', 'exists:positions,id'],
            'grade_id' => ['nullable', 'uuid', 'exists:grades,id'],
            'reports_to' => ['nullable', 'uuid', 'exists:employees,id'],
            'employee_number' => ['required', 'string', 'max:50', 'unique:employees,employee_number,' . $employeeId . ',id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', 'string', 'in:male,female'],
            'birth_date' => ['required', 'date', 'before:today'],
            'join_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:join_date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'id_number' => ['nullable', 'string', 'max:30'],
            'tax_number' => ['nullable', 'string', 'max:30'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'religion' => ['nullable', 'string', 'max:20'],
            'marital_status' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'status' => ['required', 'string', 'in:applicant,probation,contract,permanent,resigned,retired,terminated'],
            'employment_type' => ['nullable', 'string', 'in:permanent,contract,internship,outsource'],
            'photo_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
