<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LeaveApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'approver_id' => ['required', 'uuid', 'exists:users,id'],
            'comments' => ['nullable', 'string', 'max:255'],
        ];
    }
}
