<?php

declare(strict_types=1);

namespace Modules\Organization\Http\Requests\Position;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $positionId = $this->route('position');

        return [
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'division_id' => ['nullable', 'uuid', 'exists:divisions,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:positions,code,' . $positionId . ',id'],
            'job_description' => ['nullable', 'string'],
        ];
    }
}
