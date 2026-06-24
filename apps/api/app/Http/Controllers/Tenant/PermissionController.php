<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\BaseController;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;

class PermissionController extends BaseController
{
    /**
     * Display a listing of all permissions.
     */
    public function index(): JsonResponse
    {
        $permissions = Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
            ];
        });

        return $this->successResponse($permissions, 'Permissions retrieved successfully');
    }
}
