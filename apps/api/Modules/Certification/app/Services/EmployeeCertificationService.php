<?php

declare(strict_types=1);

namespace Modules\Certification\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Certification\Repositories\EmployeeCertificationRepositoryInterface;
use Modules\Certification\Models\EmployeeCertification;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EmployeeCertificationService
{
    public function __construct(
        private readonly EmployeeCertificationRepositoryInterface $repository
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findOrFail(string $id): EmployeeCertification
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data, ?UploadedFile $file = null): EmployeeCertification
    {
        return DB::transaction(function () use ($data, $file) {
            $documentPath = null;
            if ($file) {
                $documentPath = $this->uploadFile($file);
            }

            // Determine status based on expiration date
            $status = 'Active';
            if (!empty($data['expired_date'])) {
                $expiredDate = Carbon::parse($data['expired_date']);
                $diff = now()->diffInDays($expiredDate, false);
                if ($diff < 0) {
                    $status = 'Expired';
                } elseif ($diff <= 30) {
                    $status = 'Pending_Renewal';
                }
            }

            return $this->repository->create(array_merge($data, [
                'document_path' => $documentPath,
                'status' => $status,
            ]));
        });
    }

    public function update(string $id, array $data, ?UploadedFile $file = null): EmployeeCertification
    {
        return DB::transaction(function () use ($id, $data, $file) {
            $empCert = $this->repository->findOrFail($id);
            $documentPath = $empCert->document_path;

            if ($file) {
                // Delete old file
                if ($documentPath) {
                    $this->deleteFile($documentPath);
                }
                // Upload new file
                $documentPath = $this->uploadFile($file);
            }

            // Determine status based on expiration date
            $status = $data['status'] ?? $empCert->status;
            if (!empty($data['expired_date'])) {
                $expiredDate = Carbon::parse($data['expired_date']);
                $diff = now()->diffInDays($expiredDate, false);
                if ($diff < 0) {
                    $status = 'Expired';
                } elseif ($diff <= 30) {
                    $status = 'Pending_Renewal';
                } else {
                    $status = 'Active';
                }
            }

            $updateData = array_merge($data, [
                'document_path' => $documentPath,
                'status' => $status,
            ]);

            return $this->repository->update($id, $updateData);
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            $empCert = $this->repository->findOrFail($id);
            if ($empCert->document_path) {
                $this->deleteFile($empCert->document_path);
            }
            return $this->repository->delete($id);
        });
    }

    public function getSignedUrl(string $id, int $expiresInMinutes = 15): string
    {
        $empCert = $this->repository->findOrFail($id);
        if (!$empCert->document_path) {
            throw new \Exception('No document attached to this certificate.');
        }

        return Storage::disk('s3')->temporaryUrl(
            $empCert->document_path,
            now()->addMinutes($expiresInMinutes)
        );
    }

    /**
     * Get expiry alerts and statistics for certifications.
     */
    public function getExpiryStats(): array
    {
        $tenantId = tenant('id') ?? 'central';

        $total = EmployeeCertification::count();
        $active = EmployeeCertification::where('status', 'Active')->count();
        $expired = EmployeeCertification::where('status', 'Expired')->count();
        $pendingRenewal = EmployeeCertification::where('status', 'Pending_Renewal')->count();

        // Expiring threshold details
        $now = now();
        $expiring7Days = EmployeeCertification::where('status', 'Active')
            ->whereBetween('expired_date', [$now, $now->copy()->addDays(7)])
            ->count();
        $expiring30Days = EmployeeCertification::where('status', 'Active')
            ->whereBetween('expired_date', [$now, $now->copy()->addDays(30)])
            ->count();
        $expiring60Days = EmployeeCertification::where('status', 'Active')
            ->whereBetween('expired_date', [$now, $now->copy()->addDays(60)])
            ->count();
        $expiring90Days = EmployeeCertification::where('status', 'Active')
            ->whereBetween('expired_date', [$now, $now->copy()->addDays(90)])
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'expired' => $expired,
            'pending_renewal' => $pendingRenewal,
            'expiring_7_days' => $expiring7Days,
            'expiring_30_days' => $expiring30Days,
            'expiring_60_days' => $expiring60Days,
            'expiring_90_days' => $expiring90Days,
        ];
    }

    // === Helper Methods ===

    private function uploadFile(UploadedFile $file): string
    {
        $tenantId = tenant('id') ?? 'central';
        $extension = $file->getClientOriginalExtension();
        $uniqueName = Str::uuid()->toString() . '.' . $extension;
        $mimeType = $file->getMimeType() ?? $file->getClientMimeType();
        $storagePath = "tenants/{$tenantId}/certifications/" . date('Y/m') . "/{$uniqueName}";

        Storage::disk('s3')->put($storagePath, file_get_contents($file->getRealPath()), [
            'visibility' => 'private',
            'ContentType' => $mimeType,
        ]);

        return $storagePath;
    }

    private function deleteFile(string $path): void
    {
        if (Storage::disk('s3')->exists($path)) {
            Storage::disk('s3')->delete($path);
        }
    }
}
