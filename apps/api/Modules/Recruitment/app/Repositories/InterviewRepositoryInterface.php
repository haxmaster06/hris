<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\Interview;
use Illuminate\Pagination\LengthAwarePaginator;

interface InterviewRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Interview;
    public function create(array $data): Interview;
    public function update(string $id, array $data): Interview;
    public function delete(string $id): bool;
}
