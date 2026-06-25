<?php

declare(strict_types=1);

namespace Modules\Audit\Repositories;

use Modules\Audit\Models\AuditLog;
use Illuminate\Pagination\LengthAwarePaginator;

class AuditLogRepository implements AuditLogRepositoryInterface
{
    public function __construct(
        private readonly AuditLog $model
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->model->query()->with('user');

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (!empty($filters['auditable_type'])) {
            $query->where('auditable_type', $filters['auditable_type']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', $search)
                  ->orWhere('auditable_label', 'like', $search)
                  ->orWhere('auditable_type', 'like', $search)
                  ->orWhere('action', 'like', $search);
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('created_at', [$filters['start_date'] . ' 00:00:00', $filters['end_date'] . ' 23:59:59']);
        }

        $perPage = isset($filters['per_page']) ? (int) $filters['per_page'] : 20;

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findOrFail(string $id): AuditLog
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $data): AuditLog
    {
        // IP dan User Agent bisa ditangkap langsung jika tidak dikirim dari luar
        $data['ip_address'] = $data['ip_address'] ?? request()->ip();
        $data['user_agent'] = $data['user_agent'] ?? request()->userAgent();
        $data['created_at'] = now();

        return $this->model->create($data);
    }
}
