<?php

declare(strict_types=1);

namespace Modules\Certification\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Modules\Employee\Http\Resources\EmployeeResource;

class EmployeeCertificationResource extends JsonResource
{
    public function toArray($request): array
    {
        $documentUrl = null;
        if ($this->document_path) {
            try {
                $documentUrl = Storage::disk('s3')->temporaryUrl(
                    $this->document_path,
                    now()->addMinutes(15)
                );
            } catch (\Exception $e) {
                $documentUrl = null;
            }
        }

        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'employee' => new EmployeeResource($this->whenLoaded('employee')),
            'certification_id' => $this->certification_id,
            'certification' => new CertificationResource($this->whenLoaded('certification')),
            'certificate_number' => $this->certificate_number,
            'issue_date' => $this->issue_date?->toDateString(),
            'expired_date' => $this->expired_date?->toDateString(),
            'document_path' => $this->document_path,
            'document_url' => $documentUrl,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'version' => $this->version,
        ];
    }
}
