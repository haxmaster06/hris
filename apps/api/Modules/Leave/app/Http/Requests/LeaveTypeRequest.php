<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $leaveTypeId = $this->route('leave_type');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('leave_types', 'code')->ignore($leaveTypeId),
            ],
            'default_days' => ['required', 'integer', 'min:0'],
            'is_paid' => ['required', 'boolean'],
        ];
    }
}
