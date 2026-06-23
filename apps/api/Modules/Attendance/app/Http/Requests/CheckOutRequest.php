<?php

declare(strict_types=1);

namespace Modules\Attendance\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'check_out_time' => ['required', 'date'], // contains date and time, e.g. Y-m-d H:i:s
        ];
    }
}
