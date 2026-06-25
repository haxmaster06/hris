<?php

declare(strict_types=1);

namespace Modules\Document\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpeg,png,jpg,doc,docx,xls,xlsx'],
            'employee_id' => ['nullable', 'uuid', 'exists:employees,id'],
            'document_category_id' => ['nullable', 'uuid', 'exists:document_categories,id'],
            'expiry_date' => ['nullable', 'date'],
            'document_type' => ['nullable', 'string', 'max:50'],
        ];
    }
}
