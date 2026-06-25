<?php

declare(strict_types=1);

namespace Modules\Employee\Services;

use Modules\Employee\Repositories\EmergencyContactRepositoryInterface;
use Modules\Employee\Models\EmergencyContact;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EmergencyContactService
{
    public function __construct(
        private readonly EmergencyContactRepositoryInterface $repository
    ) {}

    public function list(string $employeeId, array $filters = []): LengthAwarePaginator
    {
        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;
        return $this->repository->paginate($employeeId, $perPage);
    }

    public function findOrFail(string $id): EmergencyContact
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): EmergencyContact
    {
        return DB::transaction(function () use ($data) {
            if (!empty($data['is_primary'])) {
                $this->clearPrimaryContacts($data['employee_id']);
            }

            return $this->repository->create($data);
        });
    }

    public function update(string $id, array $data): EmergencyContact
    {
        return DB::transaction(function () use ($id, $data) {
            $contact = $this->findOrFail($id);
            
            if (!empty($data['is_primary'])) {
                $this->clearPrimaryContacts($contact->employee_id);
            }

            return $this->repository->update($id, $data);
        });
    }

    public function delete(string $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->repository->delete($id);
        });
    }

    private function clearPrimaryContacts(string $employeeId): void
    {
        EmergencyContact::query()
            ->where('employee_id', $employeeId)
            ->where('is_primary', true)
            ->update(['is_primary' => false]);
    }
}
