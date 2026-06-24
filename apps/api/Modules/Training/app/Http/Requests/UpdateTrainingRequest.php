<?php

declare(strict_types=1);

namespace Modules\Training\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrainingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('training');

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50', 'unique:trainings,code,' . $id],
            'category' => ['nullable', 'string', 'in:Leadership,Technical,Safety,Compliance'],
            'type' => ['nullable', 'string', 'in:Internal,External'],
            'description' => ['nullable', 'string'],
        ];
    }
}
