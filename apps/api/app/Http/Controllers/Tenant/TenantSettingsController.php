<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TenantSettingsController extends BaseController
{
    /**
     * Get the active tenant settings.
     */
    public function show(): JsonResponse
    {
        $tenant = tenant();

        if (!$tenant) {
            return $this->errorResponse('No active company found', 404);
        }

        return $this->successResponse([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $tenant->domains()->first()?->domain ?? '',
            'logo_url' => $tenant->logo_url ?? null,
        ], 'Company settings retrieved successfully');
    }

    /**
     * Update the active tenant settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        $tenant = tenant();

        if (!$tenant) {
            return $this->errorResponse('No active company found', 404);
        }

        try {
            $tenant->update([
                'name' => $request->name,
            ]);

            return $this->successResponse([
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $tenant->domains()->first()?->domain ?? '',
                'logo_url' => $tenant->logo_url ?? null,
            ], 'Company settings updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update company settings: ' . $e->getMessage(), 500);
        }
    }
}
