<?php

declare(strict_types=1);

namespace Modules\Document\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Document\Models\Document;
use Modules\Document\Repositories\DocumentRepositoryInterface;
use Illuminate\Validation\ValidationException;

class DocumentService
{
    public function __construct(
        private readonly DocumentRepositoryInterface $documentRepository
    ) {}

    public function upload(
        UploadedFile $file,
        ?string $employeeId = null,
        ?string $categoryId = null,
        ?string $expiryDate = null
    ): Document {
        // Tentukan tenant ID untuk pemisahan folder
        $tenantId = tenant('id') ?? 'central';

        // Tentukan nama file yang unik
        $extension = $file->getClientOriginalExtension();
        $uniqueName = Str::uuid()->toString() . '.' . $extension;
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType() ?? $file->getClientMimeType();
        $fileSize = $file->getSize();

        // Path penyimpanan terisolasi
        $year = date('Y');
        $month = date('m');
        $storagePath = "tenants/{$tenantId}/documents/{$year}/{$month}/{$uniqueName}";

        // Upload ke S3/MinIO
        Storage::disk('s3')->put($storagePath, file_get_contents($file->getRealPath()), [
            'visibility' => 'private',
            'ContentType' => $mimeType,
        ]);

        // Catat metadata ke database
        return $this->documentRepository->create([
            'employee_id' => $employeeId,
            'document_category_id' => $categoryId,
            'file_name' => $uniqueName,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'storage_provider' => 's3',
            'storage_path' => $storagePath,
            'expiry_date' => $expiryDate,
        ]);
    }

    public function getSignedUrl(string $id, int $expiresInMinutes = 15): string
    {
        $document = $this->documentRepository->findOrFail($id);

        return Storage::disk('s3')->temporaryUrl(
            $document->storage_path,
            now()->addMinutes($expiresInMinutes)
        );
    }

    public function delete(string $id): bool
    {
        $document = $this->documentRepository->findOrFail($id);

        // Hapus file fisik dari S3
        if (Storage::disk('s3')->exists($document->storage_path)) {
            Storage::disk('s3')->delete($document->storage_path);
        }

        // Hapus record dari database
        return $this->documentRepository->delete($id);
    }

    public function listByEmployee(string $employeeId, array $filters = [])
    {
        return $this->documentRepository->findByEmployee($employeeId, $filters);
    }

    public function findOrFail(string $id): Document
    {
        return $this->documentRepository->findOrFail($id);
    }
}
