<?php

declare(strict_types=1);

namespace Modules\Employee\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Employee\Http\Resources\EmployeeHistoryCollection;
use Modules\Employee\Http\Resources\EmployeeHistoryResource;
use Modules\Employee\Services\EmployeeHistoryService;

class EmployeeHistoryController extends BaseController
{
    public function __construct(
        private readonly EmployeeHistoryService $service
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        Gate::authorize('employee.history.read');

        $histories = $this->service->list($employeeId, $request->all());

        return $this->successResponse(
            new EmployeeHistoryCollection($histories),
            'Employee histories retrieved successfully'
        );
    }

    public function show(string $employeeId, string $id): JsonResponse
    {
        Gate::authorize('employee.history.read');

        $history = $this->service->findOrFail($id);

        return $this->successResponse(
            new EmployeeHistoryResource($history),
            'Employee history retrieved successfully'
        );
    }
}
