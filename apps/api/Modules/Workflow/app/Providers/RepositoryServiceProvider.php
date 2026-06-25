<?php

declare(strict_types=1);

namespace Modules\Workflow\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Workflow\Repositories\WorkflowDefinitionRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowDefinitionRepository;
use Modules\Workflow\Repositories\WorkflowStepRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowStepRepository;
use Modules\Workflow\Repositories\WorkflowInstanceRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowInstanceRepository;
use Modules\Workflow\Repositories\WorkflowActionRepositoryInterface;
use Modules\Workflow\Repositories\WorkflowActionRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(WorkflowDefinitionRepositoryInterface::class, WorkflowDefinitionRepository::class);
        $this->app->singleton(WorkflowStepRepositoryInterface::class, WorkflowStepRepository::class);
        $this->app->singleton(WorkflowInstanceRepositoryInterface::class, WorkflowInstanceRepository::class);
        $this->app->singleton(WorkflowActionRepositoryInterface::class, WorkflowActionRepository::class);
    }
}
