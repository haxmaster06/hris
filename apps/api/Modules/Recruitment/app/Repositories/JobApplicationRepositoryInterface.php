<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\JobApplication;
use Illuminate\Pagination\LengthAwarePaginator;

interface JobApplicationRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): JobApplication;
    public function create(array $data): JobApplication;
    public function update(string $id, array $data): JobApplication;
    public function delete(string $id): bool;
}
