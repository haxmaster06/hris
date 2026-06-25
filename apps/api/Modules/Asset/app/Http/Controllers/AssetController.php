<?php

declare(strict_types=1);

namespace Modules\Asset\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Asset\Models\Asset;

class AssetController extends BaseController
{
    /**
     * List all assets.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('asset.view');

        $query = Asset::query();

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('condition')) {
            $query->where('condition', $request->input('condition'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('asset_number', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        $assets = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($assets, 'Assets retrieved successfully.');
    }

    /**
     * Create new asset entry.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('asset.create');

        $validated = $request->validate([
            'asset_number' => 'required|string|max:30|unique:assets,asset_number',
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:laptop,desktop,monitor,phone,tablet,sim_card,vehicle,furniture,other',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'specifications' => 'nullable|string',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric',
            'vendor' => 'nullable|string|max:100',
            'condition' => 'string|in:new,good,fair,poor,damaged',
            'status' => 'string|in:available,assigned,maintenance,disposed,lost',
            'location' => 'nullable|string|max:255',
            'warranty_expiry' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $asset = Asset::create($validated);

        return $this->createdResponse($asset, 'Asset created successfully.');
    }

    /**
     * View single asset details.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('asset.view');

        $asset = Asset::with('assignments.employee')->findOrFail($id);

        return $this->successResponse($asset, 'Asset retrieved successfully.');
    }

    /**
     * Update asset entry.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('asset.update');

        $asset = Asset::findOrFail($id);

        $validated = $request->validate([
            'asset_number' => "required|string|max:30|unique:assets,asset_number,{$id},id",
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:laptop,desktop,monitor,phone,tablet,sim_card,vehicle,furniture,other',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'specifications' => 'nullable|string',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric',
            'vendor' => 'nullable|string|max:100',
            'condition' => 'required|string|in:new,good,fair,poor,damaged',
            'status' => 'required|string|in:available,assigned,maintenance,disposed,lost',
            'location' => 'nullable|string|max:255',
            'warranty_expiry' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $asset->update($validated);

        return $this->successResponse($asset, 'Asset updated successfully.');
    }

    /**
     * Delete asset.
     */
    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('asset.delete');

        $asset = Asset::findOrFail($id);
        $asset->delete();

        return $this->successResponse(null, 'Asset deleted successfully.');
    }
}
