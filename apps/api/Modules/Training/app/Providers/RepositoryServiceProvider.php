<?php

declare(strict_types=1);

namespace Modules\Training\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Training\Repositories\TrainingRepositoryInterface;
use Modules\Training\Repositories\TrainingRepository;
use Modules\Training\Repositories\TrainingSessionRepositoryInterface;
use Modules\Training\Repositories\TrainingSessionRepository;
use Modules\Training\Repositories\TrainingParticipantRepositoryInterface;
use Modules\Training\Repositories\TrainingParticipantRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TrainingRepositoryInterface::class, TrainingRepository::class);
        $this->app->singleton(TrainingSessionRepositoryInterface::class, TrainingSessionRepository::class);
        $this->app->singleton(TrainingParticipantRepositoryInterface::class, TrainingParticipantRepository::class);
    }
}
