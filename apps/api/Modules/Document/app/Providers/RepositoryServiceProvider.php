<?php

declare(strict_types=1);

namespace Modules\Document\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Document\Repositories\DocumentCategoryRepositoryInterface;
use Modules\Document\Repositories\DocumentCategoryRepository;
use Modules\Document\Repositories\DocumentRepositoryInterface;
use Modules\Document\Repositories\DocumentRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(DocumentCategoryRepositoryInterface::class, DocumentCategoryRepository::class);
        $this->app->bind(DocumentRepositoryInterface::class, DocumentRepository::class);
    }
}
