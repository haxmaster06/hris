<?php

declare(strict_types=1);

namespace Modules\Audit\Repositories;

use Modules\Audit\Models\LoginHistory;
use Illuminate\Pagination\LengthAwarePaginator;

class LoginHistoryRepository implements LoginHistoryRepositoryInterface
{
    public function __construct(
        private readonly LoginHistory $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with('user');

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', $search)
                  ->orWhere('device', 'like', $search)
                  ->orWhere('browser', 'like', $search)
                  ->orWhere('os', 'like', $search)
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', $search)
                        ->orWhere('username', 'like', $search);
                  });
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('login_at', [$filters['start_date'] . ' 00:00:00', $filters['end_date'] . ' 23:59:59']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('login_at', 'desc')->paginate($perPage);
    }

    public function findOrFail(string $id): LoginHistory
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): LoginHistory
    {
        return $this->model->create($data);
    }

    public function update(string $id, array $data): LoginHistory
    {
        $history = $this->findOrFail($id);
        $history->update($data);
        return $history->fresh();
    }

    public function findLatestForUser(string $userId): ?LoginHistory
    {
        return $this->model->where('user_id', $userId)
            ->orderBy('login_at', 'desc')
            ->first();
    }

    public function hasDeviceBefore(string $userId, string $deviceHash): bool
    {
        $histories = $this->model->where('user_id', $userId)
            ->where('status', 'success')
            ->get();

        foreach ($histories as $history) {
            $hash = md5(($history->browser ?? '') . '|' . ($history->os ?? '') . '|' . ($history->device ?? ''));
            if ($hash === $deviceHash) {
                return true;
            }
        }

        return false;
    }
}
