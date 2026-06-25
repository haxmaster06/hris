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
     * Create a new AuthController instance.
     */
    public function __construct(
        private readonly \Modules\Audit\Repositories\LoginHistoryRepositoryInterface $loginHistoryRepo
    ) {}

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
        $user = \App\Models\User::where('email', $credentials['email'])->first();

        if (! $token = Auth::guard('api')->attempt($credentials)) {
            if ($user) {
                $this->logLogin($request, $user, 'failed');
            }
            return $this->errorResponse('Invalid email or password', 401);
        }

        $loginHistory = $this->logLogin($request, $user, 'success');

        return $this->respondWithToken($token, 'Login successful', $loginHistory ? (bool) $loginHistory->is_new_device : false);
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
        $user = Auth::guard('api')->user();
        if ($user) {
            $latest = $this->loginHistoryRepo->findLatestForUser($user->id);
            if ($latest) {
                $this->loginHistoryRepo->update($latest->id, ['logout_at' => now()]);
            }
        }

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
    protected function respondWithToken(string $token, string $message, bool $isNewDevice = false): JsonResponse
    {
        $data = [
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
        ];

        if ($isNewDevice) {
            $data['is_new_device'] = true;
        }

        return $this->successResponse($data, $message);
    }

    /**
     * Helper untuk memproses pencatatan log login
     */
    private function logLogin(Request $request, \App\Models\User $user, string $status): ?\Modules\Audit\Models\LoginHistory
    {
        $userAgent = $request->userAgent() ?? '';
        $ip = $request->ip() ?? '127.0.0.1';

        // Parser User-Agent sederhana
        $browser = 'Unknown Browser';
        if (preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari/i', $userAgent) && !preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Opera|OPR/i', $userAgent)) {
            $browser = 'Opera';
        } elseif (preg_match('/Edge/i', $userAgent)) {
            $browser = 'Edge';
        }

        $os = 'Unknown OS';
        if (preg_match('/Windows/i', $userAgent)) {
            $os = 'Windows';
        } elseif (preg_match('/Macintosh|Mac OS X/i', $userAgent)) {
            $os = 'macOS';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $os = 'Linux';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $os = 'Android';
        } elseif (preg_match('/iPhone|iPad/i', $userAgent)) {
            $os = 'iOS';
        }

        $device = 'Desktop';
        if (preg_match('/Mobile/i', $userAgent)) {
            $device = 'Mobile';
        } elseif (preg_match('/iPad|Tablet/i', $userAgent)) {
            $device = 'Tablet';
        }

        $deviceHash = md5($browser . '|' . $os . '|' . $device);

        $isNewDevice = false;
        if ($status === 'success') {
            // Cek apakah user pernah login sukses sebelumnya
            $hasSuccessBefore = \Modules\Audit\Models\LoginHistory::where('user_id', $user->id)
                ->where('status', 'success')
                ->exists();

            if ($hasSuccessBefore) {
                // Jika sudah ada record login sukses, cek apakah device ini baru
                $hasDeviceBefore = $this->loginHistoryRepo->hasDeviceBefore($user->id, $deviceHash);
                if (!$hasDeviceBefore) {
                    $isNewDevice = true;
                }
            }
        }

        // Estimasi lokasi sederhana untuk testing local dev
        $location = $ip === '127.0.0.1' || $ip === '::1' ? 'Local Development' : 'Jakarta, Indonesia';

        return $this->loginHistoryRepo->create([
            'user_id' => $user->id,
            'ip_address' => $ip,
            'device' => $device,
            'browser' => $browser,
            'os' => $os,
            'location' => $location,
            'status' => $status,
            'login_at' => now(),
            'is_new_device' => $isNewDevice,
        ]);
    }
}
