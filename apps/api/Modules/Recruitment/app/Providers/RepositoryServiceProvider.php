<?php

declare(strict_types=1);

namespace Modules\Recruitment\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Recruitment\Repositories\VacancyRepositoryInterface;
use Modules\Recruitment\Repositories\VacancyRepository;
use Modules\Recruitment\Repositories\CandidateRepositoryInterface;
use Modules\Recruitment\Repositories\CandidateRepository;
use Modules\Recruitment\Repositories\JobApplicationRepositoryInterface;
use Modules\Recruitment\Repositories\JobApplicationRepository;
use Modules\Recruitment\Repositories\InterviewRepositoryInterface;
use Modules\Recruitment\Repositories\InterviewRepository;
use Modules\Recruitment\Repositories\HiringApprovalRepositoryInterface;
use Modules\Recruitment\Repositories\HiringApprovalRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(VacancyRepositoryInterface::class, VacancyRepository::class);
        $this->app->singleton(CandidateRepositoryInterface::class, CandidateRepository::class);
        $this->app->singleton(JobApplicationRepositoryInterface::class, JobApplicationRepository::class);
        $this->app->singleton(InterviewRepositoryInterface::class, InterviewRepository::class);
        $this->app->singleton(HiringApprovalRepositoryInterface::class, HiringApprovalRepository::class);
    }
}
