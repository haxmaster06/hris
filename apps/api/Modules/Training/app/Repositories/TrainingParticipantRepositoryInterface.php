<?php

declare(strict_types=1);

namespace Modules\Training\Repositories;

use Modules\Training\Models\TrainingParticipant;
use Illuminate\Pagination\LengthAwarePaginator;

interface TrainingParticipantRepositoryInterface
{
    public function paginate(int $perPage, array $filters): LengthAwarePaginator;
    public function findOrFail(string $id): TrainingParticipant;
    public function create(array $data): TrainingParticipant;
    public function update(string $id, array $data): TrainingParticipant;
    public function delete(string $id): bool;
}
