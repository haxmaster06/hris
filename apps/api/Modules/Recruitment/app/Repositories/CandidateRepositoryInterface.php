<?php

declare(strict_types=1);

namespace Modules\Recruitment\Repositories;

use Modules\Recruitment\Models\Candidate;
use Illuminate\Pagination\LengthAwarePaginator;

interface CandidateRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): Candidate;
    public function create(array $data): Candidate;
    public function update(string $id, array $data): Candidate;
    public function delete(string $id): bool;
}
