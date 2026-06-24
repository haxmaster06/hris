<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\BaseController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate((int) $request->input('per_page', 10));

        // Format data to include role list
        $formattedData = $users->getCollection()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];
        });

        return $this->successResponse([
            'data' => $formattedData,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ], 'Users retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        // Security Gate: Non-Super Admin cannot assign Super Admin role
        if (in_array('Super Admin', $request->input('roles', []))) {
            $currentUser = auth()->user();
            if (!$currentUser || !$currentUser->hasRole('Super Admin')) {
                return $this->errorResponse('Unauthorized to create Super Admin user', 403);
            }
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            // Sync Spatie roles
            $user->syncRoles($request->roles);

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'created_at' => $user->created_at,
            ];

            return $this->successResponse($userData, 'User created successfully', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::with('roles')->find($id);

        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        return $this->successResponse($userData, 'User details retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        // Super Admin PIN check:
        // Check if user is currently a Super Admin or is being assigned the Super Admin role
        $isSuperAdminRelated = $user->hasRole('Super Admin') || in_array('Super Admin', $request->input('roles', []));
        if ($isSuperAdminRelated) {
            $currentUser = auth()->user();
            if (!$currentUser || !$currentUser->hasRole('Super Admin')) {
                return $this->errorResponse('Unauthorized to modify Super Admin user or assign Super Admin role', 403);
            }

            $pinValidator = Validator::make($request->all(), [
                'super_admin_pin' => 'required|string',
            ]);

            if ($pinValidator->fails()) {
                return $this->errorResponse('Validation error', 422, $pinValidator->errors()->toArray());
            }

            if ($request->super_admin_pin !== '444329') {
                return $this->errorResponse('Validation error', 422, [
                    'super_admin_pin' => ['Invalid Super Admin authorization PIN.']
                ]);
            }
        }

        try {
            $user->name = $request->name;
            $user->email = $request->email;

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            // Sync Spatie roles
            $user->syncRoles($request->roles);

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'updated_at' => $user->updated_at,
            ];

            return $this->successResponse($userData, 'User updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }

        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return $this->errorResponse('Cannot delete your own active user account', 403);
        }

        // Prevent deleting Super Admin
        if ($user->hasRole('Super Admin')) {
            return $this->errorResponse('Super Admin user accounts cannot be deleted', 403);
        }

        try {
            $user->delete();
            return $this->successResponse(null, 'User account soft deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete user: ' . $e->getMessage(), 500);
        }
    }
}
