<?php

declare(strict_types=1);

namespace Modules\Training\Repositories;

use Modules\Training\Models\TrainingSession;
use Illuminate\Pagination\LengthAwarePaginator;

interface TrainingSessionRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): TrainingSession;
    public function create(array $data): TrainingSession;
    public function update(string $id, array $data): TrainingSession;
    public function delete(string $id): bool;
}
