<?php

declare(strict_types=1);

namespace Modules\Payroll\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Payroll\Repositories\PayrollRunRepositoryInterface;
use Modules\Payroll\Http\Resources\PayrollRunResource;

class PayrollRunController extends BaseController
{
    public function __construct(
        private readonly PayrollRunRepositoryInterface $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('payroll.read');

        $runs = $this->repository->paginate($request->all());

        return $this->successResponse(
            PayrollRunResource::collection($runs),
            'Daftar slip gaji berhasil diambil'
        );
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('payroll.read');

        $run = $this->repository->findOrFail($id);

        return $this->successResponse(
            new PayrollRunResource($run),
            'Slip gaji berhasil ditemukan'
        );
    }
}
