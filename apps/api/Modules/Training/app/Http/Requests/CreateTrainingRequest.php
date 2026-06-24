<?php

declare(strict_types=1);

namespace Modules\Training\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:trainings,code'],
            'category' => ['required', 'string', 'in:Leadership,Technical,Safety,Compliance'],
            'type' => ['required', 'string', 'in:Internal,External'],
            'description' => ['nullable', 'string'],
        ];
    }
}
