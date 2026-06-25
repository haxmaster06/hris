<?php

declare(strict_types=1);

namespace Modules\Payroll\Repositories;

use Modules\Payroll\Models\PayrollPeriod;
use Illuminate\Pagination\LengthAwarePaginator;

class PayrollPeriodRepository implements PayrollPeriodRepositoryInterface
{
    public function __construct(
        private readonly PayrollPeriod $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (!empty($filters['year'])) {
            $query->where('year', (int) $filters['year']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate($perPage);
    }

    public function findOrFail(string $id): PayrollPeriod
    {
        return $this->model->findOrFail($id);
    }

    public function findByMonthAndYear(int $month, int $year): ?PayrollPeriod
    {
        return $this->model->where('month', $month)->where('year', $year)->first();
    }

    public function create(array $data): PayrollPeriod
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): PayrollPeriod
    {
        $period = $this->findOrFail($id);
        $period->update($data);
        return $period->fresh();
    }

    public function delete(string $id): bool
    {
        $period = $this->findOrFail($id);
        return (bool) $period->delete();
    }
}
