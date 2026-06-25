<?php

declare(strict_types=1);

namespace Modules\EmployeeLifecycle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOnboardingChecklistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['required', 'string', 'in:document,equipment,account,orientation,training'],
            'task_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_completed' => ['nullable', 'boolean'],
            'assigned_to' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer'],
        ];
    }
}
