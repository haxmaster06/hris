<?php

declare(strict_types=1);

namespace Modules\Leave\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Leave\Http\Resources\LeaveBalanceResource;
use Modules\Leave\Http\Resources\LeaveBalanceCollection;
use Modules\Leave\Services\LeaveBalanceService;

class LeaveBalanceController extends BaseController
{
    public function __construct(
        private readonly LeaveBalanceService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('leave.read');

        $balances = $this->service->list($request->all());

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'leaveType'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $balances->load($relation);
                }
            }
        }

        return $this->successResponse(
            new LeaveBalanceCollection($balances),
            'Leave balances retrieved successfully'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        Gate::authorize('leave.read');

        $balance = $this->service->findOrFail($id);

        if ($request->has('include')) {
            $includes = explode(',', $request->input('include'));
            $validRelations = ['employee', 'leaveType'];
            foreach ($includes as $relation) {
                if (in_array($relation, $validRelations)) {
                    $balance->load($relation);
                }
            }
        }

        return $this->successResponse(
            new LeaveBalanceResource($balance),
            'Leave balance retrieved successfully'
        );
    }
}
