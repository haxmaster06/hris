<?php

declare(strict_types=1);

namespace Modules\Certification\Services;

use Modules\Certification\Repositories\CertificationRepositoryInterface;
use Modules\Certification\Repositories\CertificationRequirementRepositoryInterface;
use Modules\Certification\Models\Certification;
use Modules\Certification\Models\CertificationRequirement;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CertificationService
{
    public function __construct(
        private readonly CertificationRepositoryInterface $certificationRepository,
        private readonly CertificationRequirementRepositoryInterface $requirementRepository
    ) {}

    // === Certification Master ===

    public function listCertifications(array $filters = []): LengthAwarePaginator
    {
        return $this->certificationRepository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findCertification(string $id): Certification
    {
        return $this->certificationRepository->findOrFail($id);
    }

    public function createCertification(array $data): Certification
    {
        return DB::transaction(function () use ($data) {
            return $this->certificationRepository->create($data);
        });
    }

    public function updateCertification(string $id, array $data): Certification
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->certificationRepository->update($id, $data);
        });
    }

    public function deleteCertification(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->certificationRepository->delete($id);
        });
    }

    // === Certification Requirements (Matrix) ===

    public function listRequirements(array $filters = []): LengthAwarePaginator
    {
        return $this->requirementRepository->paginate(
            perPage: isset($filters['per_page']) ? (int) $filters['per_page'] : 20,
            filters: $filters
        );
    }

    public function findRequirement(string $id): CertificationRequirement
    {
        return $this->requirementRepository->findOrFail($id);
    }

    public function createRequirement(array $data): CertificationRequirement
    {
        return DB::transaction(function () use ($data) {
            return $this->requirementRepository->create($data);
        });
    }

    public function updateRequirement(string $id, array $data): CertificationRequirement
    {
        return DB::transaction(function () use ($id, $data) {
            return $this->requirementRepository->update($id, $data);
        });
    }

    public function deleteRequirement(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->requirementRepository->delete($id);
        });
    }
}
