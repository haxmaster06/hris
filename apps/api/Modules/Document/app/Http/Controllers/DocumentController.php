<?php

declare(strict_types=1);

namespace Modules\Document\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Document\Http\Requests\UploadDocumentRequest;
use Modules\Document\Http\Resources\DocumentResource;
use Modules\Document\Services\DocumentService;

class DocumentController extends BaseController
{
    public function __construct(
        private readonly DocumentService $documentService
    ) {}

    public function store(UploadDocumentRequest $request): JsonResponse
    {
        $document = $this->documentService->upload(
            file: $request->file('file'),
            employeeId: $request->input('employee_id'),
            categoryId: $request->input('document_category_id'),
            expiryDate: $request->input('expiry_date'),
            documentType: $request->input('document_type')
        );

        $document->signed_url = $this->documentService->getSignedUrl($document->id);

        return $this->successResponse(
            new DocumentResource($document),
            'Document uploaded successfully',
            201
        );
    }

    public function show(string $id): JsonResponse
    {
        $document = $this->documentService->findOrFail($id);

        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager'])) {
            $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();
            if (!$employee || $document->employee_id !== $employee->id) {
                return $this->errorResponse('Access denied', 403);
            }
        }

        $document->signed_url = $this->documentService->getSignedUrl($document->id);

        return $this->successResponse(
            new DocumentResource($document)
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $document = $this->documentService->findOrFail($id);

        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager'])) {
            $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();
            if (!$employee || $document->employee_id !== $employee->id) {
                return $this->errorResponse('Access denied', 403);
            }
        }

        $this->documentService->delete($id);

        return $this->successResponse(
            null,
            'Document deleted successfully'
        );
    }
}
