<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Http\Controllers\BaseController;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class TenantController extends BaseController implements HasMiddleware
{
    /**
     * Declare middleware for the controller.
     */
    public static function middleware(): array
    {
        return [
            (new Middleware(function ($request, $next) {
                $token = $request->header('X-Central-Token');
                $expectedToken = env('CENTRAL_API_KEY', 'nexus_central_secret');

                if ($token !== $expectedToken) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized central request. Invalid token.'
                    ], 401);
                }

                return $next($request);
            }))->except(['publicList']),
        ];
    }

    /**
     * List all tenants in the central database.
     */
    public function index(): JsonResponse
    {
        $tenants = Tenant::with('domains')->get()->map(function ($tenant) {
            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $tenant->domains->first()?->domain,
                'logo_url' => $tenant->logo_url ?? null,
                'created_at' => $tenant->created_at,
            ];
        });

        return $this->successResponse($tenants, 'Companies retrieved successfully');
    }

    /**
     * Public list of tenants for selection on login page.
     */
    public function publicList(): JsonResponse
    {
        $tenants = Tenant::all()->map(function ($tenant) {
            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'logo_url' => $tenant->logo_url ?? null,
            ];
        });
        return $this->successResponse($tenants, 'Public companies retrieved successfully');
    }

    /**
     * Create/Register a new tenant.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|alpha_dash|max:255|unique:tenants,slug',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        $tenantId = (string) Str::uuid();
        $slug = strtolower($request->slug);
        $logoUrl = null;

        try {
            if ($request->hasFile('logo')) {
                $file = $request->file('logo');
                $extension = $file->getClientOriginalExtension();
                $path = $file->storeAs('logos', $tenantId . '.' . $extension, 'public');
                $logoUrl = Storage::disk('public')->url($path);
            }

            // Create tenant
            $tenant = Tenant::create([
                'id' => $tenantId,
                'name' => $request->name,
                'slug' => $slug,
            ]);

            if ($logoUrl) {
                $tenant->logo_url = $logoUrl;
                $tenant->save();
            }

            // Map domain
            $tenant->domains()->create([
                'domain' => $slug . '.local',
            ]);

            return $this->successResponse([
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $slug . '.local',
                'logo_url' => $logoUrl,
                'created_at' => $tenant->created_at,
            ], 'Company registered successfully and database schema provisioned', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to register company: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update an existing tenant.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (!$tenant) {
            return $this->errorResponse('Company not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|alpha_dash|max:255|unique:tenants,slug,' . $id,
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation error', 422, $validator->errors()->toArray());
        }

        $slug = strtolower($request->slug);
        $logoUrl = $tenant->logo_url;

        try {
            if ($request->hasFile('logo')) {
                // Delete old logo file if exists
                if ($logoUrl) {
                    $oldPath = str_replace(Storage::disk('public')->url(''), '', $logoUrl);
                    Storage::disk('public')->delete(ltrim($oldPath, '/'));
                }

                $file = $request->file('logo');
                $extension = $file->getClientOriginalExtension();
                $path = $file->storeAs('logos', $id . '.' . $extension, 'public');
                $logoUrl = Storage::disk('public')->url($path);
            }

            // Update tenant details
            $tenant->update([
                'name' => $request->name,
                'slug' => $slug,
            ]);

            $tenant->logo_url = $logoUrl;
            $tenant->save();

            // Update domain
            $domain = $tenant->domains()->first();
            if ($domain) {
                $domain->update([
                    'domain' => $slug . '.local',
                ]);
            } else {
                $tenant->domains()->create([
                    'domain' => $slug . '.local',
                ]);
            }

            return $this->successResponse([
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $slug . '.local',
                'logo_url' => $logoUrl,
                'created_at' => $tenant->created_at,
            ], 'Company updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update company: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a tenant.
     */
    public function destroy(string $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (!$tenant) {
            return $this->errorResponse('Company not found', 404);
        }

        try {
            // Delete logo if exists
            $logoUrl = $tenant->logo_url;
            if ($logoUrl) {
                $oldPath = str_replace(Storage::disk('public')->url(''), '', $logoUrl);
                Storage::disk('public')->delete(ltrim($oldPath, '/'));
            }

            $tenant->delete();
            return $this->successResponse(null, 'Company and associated database schema deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete company: ' . $e->getMessage(), 500);
        }
    }
}
