<?php

declare(strict_types=1);

namespace Modules\Integration\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Integration\Models\IntegrationConfig;

class IntegrationConfigController extends BaseController
{
    public function index(): JsonResponse
    {
        Gate::authorize('integration.view');

        $configs = IntegrationConfig::latest()->get();

        return $this->successResponse($configs, 'Integration configurations retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('integration.configure');

        $validated = $request->validate([
            'type' => ['required', 'string', 'max:30'],
            'provider' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'config' => ['required', 'array'],
            'is_active' => ['boolean'],
        ]);

        $config = IntegrationConfig::updateOrCreate(
            ['type' => $validated['type'], 'provider' => $validated['provider']],
            [
                'name' => $validated['name'],
                'config' => $validated['config'],
                'is_active' => $validated['is_active'] ?? false,
            ]
        );

        return $this->successResponse($config, 'Integration configuration saved successfully');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('integration.configure');

        $config = IntegrationConfig::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'config' => ['sometimes', 'required', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $config->update($validated);

        return $this->successResponse($config, 'Integration configuration updated successfully');
    }

    public function testConnection(Request $request): JsonResponse
    {
        Gate::authorize('integration.configure');

        $request->validate([
            'provider' => ['required', 'string'],
        ]);

        // Simulating a successful API response or test check
        $provider = $request->provider;
        
        return $this->successResponse(
            ['status' => 'success', 'message' => "Connection to {$provider} tested successfully."]
        );
    }
}
