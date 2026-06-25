<?php

declare(strict_types=1);

namespace Modules\Workflow\Repositories;

use Modules\Workflow\Models\WorkflowAction;
use Illuminate\Support\Collection;

interface WorkflowActionRepositoryInterface
{
    public function getActionsForInstance(string $instanceId): Collection;
    public function create(array $data): WorkflowAction;
}
