<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\Vacancy;
use Illuminate\Pagination\LengthAwarePaginator;

interface VacancyRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Vacancy;
    public function create(array $data): Vacancy;
    public function update(string $id, array $data): Vacancy;
    public function delete(string $id): bool;
}
