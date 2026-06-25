<?php

declare(strict_types=1);

namespace Modules\Audit\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Audit\Repositories\LoginHistoryRepositoryInterface;

class LoginHistoryController extends BaseController
{
    public function __construct(
        private readonly LoginHistoryRepositoryInterface $loginHistoryRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('audit.login_history.read');

        $histories = $this->loginHistoryRepository->paginate($request->all());

        return $this->successResponse(
            $histories,
            'Riwayat login berhasil diambil.'
        );
    }
}
