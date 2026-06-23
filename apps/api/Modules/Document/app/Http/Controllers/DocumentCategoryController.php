<?php

declare(strict_types=1);

namespace Modules\Document\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Document\Repositories\DocumentCategoryRepositoryInterface;
use Modules\Document\Http\Resources\DocumentCategoryCollection;
use Modules\Document\Http\Resources\DocumentCategoryResource;

class DocumentCategoryController extends BaseController
{
    public function __construct(
        private readonly DocumentCategoryRepositoryInterface $categoryRepository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $categories = $this->categoryRepository->paginate(
            perPage: (int) $request->input('per_page', 20),
            filters: $request->all()
        );

        return $this->successResponse(
            new DocumentCategoryCollection($categories)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:document_categories,code'],
        ]);

        $category = $this->categoryRepository->create([
            'name' => $request->name,
            'code' => strtoupper($request->code),
        ]);

        return $this->successResponse(
            new DocumentCategoryResource($category),
            'Document category created successfully',
            201
        );
    }

    public function show(string $id): JsonResponse
    {
        $category = $this->categoryRepository->findOrFail($id);

        return $this->successResponse(
            new DocumentCategoryResource($category)
        );
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:document_categories,code,' . $id],
        ]);

        $category = $this->categoryRepository->update($id, [
            'name' => $request->name,
            'code' => strtoupper($request->code),
        ]);

        return $this->successResponse(
            new DocumentCategoryResource($category),
            'Document category updated successfully'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $this->categoryRepository->delete($id);

        return $this->successResponse(
            null,
            'Document category deleted successfully'
        );
    }
}
