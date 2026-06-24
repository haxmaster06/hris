<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class AuthController extends BaseController
{
    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        $credentials = $request->only(['email', 'password']);

        if (! $token = Auth::guard('api')->attempt($credentials)) {
            return $this->errorResponse('Invalid email or password', 401);
        }

        return $this->respondWithToken($token, 'Login successful');
    }

    /**
     * Get the authenticated User.
     */
    public function me(): JsonResponse
    {
        $user = Auth::guard('api')->user();

        if (!$user) {
            return $this->errorResponse('Unauthorized', 401);
        }

        // Include roles and permissions
        $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();

        $userData = [
            'id' => $user->id,
            'employee_id' => $employee?->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        return $this->successResponse($userData, 'User profile retrieved successfully');
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return $this->successResponse(null, 'Successfully logged out');
    }

    /**
     * Refresh a token.
     */
    public function refresh(): JsonResponse
    {
        try {
            $newToken = Auth::guard('api')->refresh();
            return $this->respondWithToken($newToken, 'Token refreshed successfully');
        } catch (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            return $this->errorResponse('Could not refresh token: ' . $e->getMessage(), 401);
        }
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken(string $token, string $message): JsonResponse
    {
        return $this->successResponse([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
        ], $message);
    }
}
