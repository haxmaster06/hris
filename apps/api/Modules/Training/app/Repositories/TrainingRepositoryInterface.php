<?php

declare(strict_types=1);

namespace Modules\Training\Repositories;

use Modules\Training\Models\Training;
use Illuminate\Pagination\LengthAwarePaginator;

interface TrainingRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Training;
    public function create(array $data): Training;
    public function update(string $id, array $data): Training;
    public function delete(string $id): bool;
}
