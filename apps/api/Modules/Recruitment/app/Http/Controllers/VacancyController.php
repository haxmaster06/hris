<?php

declare(strict_types=1);

namespace Modules\Recruitment\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Recruitment\Http\Requests\CreateVacancyRequest;
use Modules\Recruitment\Http\Requests\UpdateVacancyRequest;
use Modules\Recruitment\Http\Resources\VacancyCollection;
use Modules\Recruitment\Http\Resources\VacancyResource;
use Modules\Recruitment\Services\VacancyService;

class VacancyController extends BaseController
{
    public function __construct(
        private readonly VacancyService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.read');

        $vacancies = $this->service->list($request->all());

        return $this->successResponse(
            new VacancyCollection($vacancies),
            'Vacancies retrieved successfully'
        );
    }

    public function store(CreateVacancyRequest $request): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.create');

        $vacancy = $this->service->create($request->validated());

        return $this->createdResponse(
            new VacancyResource($vacancy),
            'Vacancy created successfully'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.read');

        $vacancy = $this->service->findOrFail($id);

        return $this->successResponse(
            new VacancyResource($vacancy),
            'Vacancy retrieved successfully'
        );
    }

    public function update(UpdateVacancyRequest $request, string $id): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.update');

        $vacancy = $this->service->update($id, $request->validated());

        return $this->successResponse(
            new VacancyResource($vacancy),
            'Vacancy updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.delete');

        $this->service->delete($id);

        return $this->successResponse(
            null,
            'Vacancy deleted successfully'
        );
    }

    public function publish(string $id): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.update');

        $vacancy = $this->service->publish($id);

        return $this->successResponse(
            new VacancyResource($vacancy),
            'Vacancy published successfully'
        );
    }

    public function close(string $id): JsonResponse
    {
        Gate::authorize('recruitment.vacancy.update');

        $vacancy = $this->service->close($id);

        return $this->successResponse(
            new VacancyResource($vacancy),
            'Vacancy closed successfully'
        );
    }
}
