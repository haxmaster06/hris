<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Tenancy;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancy
{
    protected Tenancy $tenancy;
    protected InitializeTenancyByDomain $initializeByDomain;

    public function __construct(Tenancy $tenancy, InitializeTenancyByDomain $initializeByDomain)
    {
        $this->tenancy = $tenancy;
        $this->initializeByDomain = $initializeByDomain;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 0. Super Admin Cross-Tenant authentication bypass
        $token = $request->bearerToken();
        if ($token) {
            try {
                $payload = \Tymon\JWTAuth\Facades\JWTAuth::setToken($token)->getPayload();
                $originalTenantId = $payload->get('tenant_id');

                if ($originalTenantId) {
                    $tenantModel = config('tenancy.tenant_model');
                    $originalTenant = $tenantModel::find($originalTenantId);

                    if ($originalTenant) {
                        // Switch to original tenant temporarily
                        $this->tenancy->initialize($originalTenant);

                        $user = \Tymon\JWTAuth\Facades\JWTAuth::setToken($token)->authenticate();

                        if ($user && $user->hasRole('Super Admin')) {
                            // User is Super Admin! Now resolve target tenant
                            $user->is_super_admin = true;
                            $targetTenantId = $request->header('X-Tenant-ID');

                            if ($targetTenantId && $targetTenantId !== $originalTenantId) {
                                $targetTenant = $tenantModel::find($targetTenantId);
                                if (!$targetTenant) {
                                    $targetTenant = $tenantModel::where('slug', $targetTenantId)->first();
                                }

                                if ($targetTenant) {
                                    $this->tenancy->end();
                                    $this->tenancy->initialize($targetTenant);
                                }
                            }

                            // Keep the user authenticated in Auth guards so it does not query DB again
                            \Illuminate\Support\Facades\Auth::setUser($user);
                            \Illuminate\Support\Facades\Auth::guard('api')->setUser($user);

                            return $next($request);
                        }

                        // Revert tenancy if user is not Super Admin
                        $this->tenancy->end();
                    }
                }
            } catch (\Exception $e) {
                if ($this->tenancy->initialized) {
                    $this->tenancy->end();
                }
            }
        }

        // 1. Try to initialize by X-Tenant-ID header
        $tenantId = $request->header('X-Tenant-ID');
        if ($tenantId) {
            $tenantModel = config('tenancy.tenant_model');
            
            $tenant = null;
            if (\Illuminate\Support\Str::isUuid($tenantId)) {
                $tenant = $tenantModel::find($tenantId);
            }
            
            if (!$tenant) {
                $tenant = $tenantModel::where('slug', $tenantId)->first();
            }
            
            if ($tenant) {
                $this->tenancy->initialize($tenant);
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'message' => 'Tenant not found with the provided X-Tenant-ID header'
            ], 404);
        }

        // 2. Fallback to domain/subdomain matching
        try {
            return $this->initializeByDomain->handle($request, $next);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant could not be identified'
            ], 400);
        }
    }
}
