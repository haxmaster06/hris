<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\BaseController;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends BaseController
{
    /**
     * Display a listing of all roles in the tenant database with their permissions.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ];
        });

        return $this->successResponse($roles, 'Roles retrieved successfully');
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        try {
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'api',
            ]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            return $this->successResponse([
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ], 'Role created successfully', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified role.
     */
    public function show(string $id): JsonResponse
    {
        $role = Role::with('permissions')->find($id);

        if (!$role) {
            return $this->errorResponse('Role not found', 404);
        }

        return $this->successResponse([
            'id' => $role->id,
            'name' => $role->name,
            'permissions' => $role->permissions->pluck('name'),
        ], 'Role retrieved successfully');
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return $this->errorResponse('Role not found', 404);
        }

        $isDefaultRole = in_array($role->name, ['Super Admin', 'HR Manager', 'Employee']);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name,' . $id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        try {
            // Only update name if it's not a default system role
            if (!$isDefaultRole) {
                $role->name = $request->name;
                $role->save();
            }

            // Sync permissions (Super Admin always retains all permissions)
            if ($role->name === 'Super Admin') {
                $allPermissions = \App\Models\Permission::all();
                $role->syncPermissions($allPermissions);
            } else {
                if ($request->has('permissions')) {
                    $role->syncPermissions($request->permissions);
                }
            }

            return $this->successResponse([
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ], 'Role updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update role: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return $this->errorResponse('Role not found', 404);
        }

        if (in_array($role->name, ['Super Admin', 'HR Manager', 'Employee'])) {
            return $this->errorResponse('Default system roles cannot be deleted', 403);
        }

        try {
            $role->delete();
            return $this->successResponse(null, 'Role deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete role: ' . $e->getMessage(), 500);
        }
    }
}
