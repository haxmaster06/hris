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
        // 1. Try to initialize by X-Tenant-ID header
        $tenantId = $request->header('X-Tenant-ID');
        if ($tenantId) {
            $tenantModel = config('tenancy.tenant_model');
            $tenant = $tenantModel::find($tenantId);
            
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
