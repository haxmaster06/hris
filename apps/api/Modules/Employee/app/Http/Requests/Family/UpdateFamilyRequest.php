<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Requests\Family;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFamilyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'relationship' => ['required', 'string', 'in:spouse,child,parent'],
            'birth_date' => ['nullable', 'date', 'before:today'],
        ];
    }
}
