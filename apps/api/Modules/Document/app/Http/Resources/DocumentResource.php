<?php

declare(strict_types=1);

namespace Modules\Document\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Employee\Http\Resources\EmployeeResource;

class DocumentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'document_category_id' => $this->document_category_id,
            'category' => new DocumentCategoryResource($this->whenLoaded('category')),
            'file_name' => $this->file_name,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'storage_provider' => $this->storage_provider,
            'storage_path' => $this->storage_path,
            'expiry_date' => $this->expiry_date?->toDateString(),
            'document_type' => $this->document_type,
            'versions' => DocumentVersionResource::collection($this->whenLoaded('versions')),
            'signed_url' => $this->when(isset($this->resource->signed_url), $this->resource->signed_url),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
