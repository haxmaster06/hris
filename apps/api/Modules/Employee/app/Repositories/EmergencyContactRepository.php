<?php

declare(strict_types=1);

namespace Modules\Employee\Repositories;

use Modules\Employee\Models\EmergencyContact;
use Illuminate\Pagination\LengthAwarePaginator;

class EmergencyContactRepository implements EmergencyContactRepositoryInterface
{
    public function __construct(
        private readonly EmergencyContact $model
    ) {}

    public function paginate(string $employeeId, int $perPage = 20): LengthAwarePaginator
    {
        return $this->model->query()
            ->where('employee_id', $employeeId)
            ->orderBy('is_primary', 'desc')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): EmergencyContact
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): EmergencyContact
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): EmergencyContact
    {
        $contact = $this->findOrFail($id);
        $contact->update($data);
        return $contact->fresh();
    }

    public function delete(string $id): bool
    {
        $contact = $this->findOrFail($id);
        return (bool) $contact->delete();
    }
}
