<?php

declare(strict_types=1);

namespace Modules\Document\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Document\Http\Requests\UploadDocumentRequest;
use Modules\Document\Http\Resources\DocumentCollection;
use Modules\Document\Http\Resources\DocumentResource;
use Modules\Document\Services\DocumentService;

class EmployeeDocumentController extends BaseController
{
    public function __construct(
        private readonly DocumentService $documentService
    ) {}

    public function index(Request $request, string $employeeId): JsonResponse
    {
        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager'])) {
            $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();
            if (!$employee || $employee->id !== $employeeId) {
                return $this->errorResponse('Access denied', 403);
            }
        }

        $documents = $this->documentService->listByEmployee(
            employeeId: $employeeId,
            filters: $request->all()
        );

        // Generate signed URL untuk setiap item di koleksi
        foreach ($documents->items() as $document) {
            $document->signed_url = $this->documentService->getSignedUrl($document->id);
        }

        return $this->successResponse(
            new DocumentCollection($documents)
        );
    }

    public function store(UploadDocumentRequest $request, string $employeeId): JsonResponse
    {
        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'HR Admin', 'HR Manager', 'Manager'])) {
            $employee = \Modules\Employee\Models\Employee::where('user_id', $user->id)->first();
            if (!$employee || $employee->id !== $employeeId) {
                return $this->errorResponse('Access denied', 403);
            }
        }

        $document = $this->documentService->upload(
            file: $request->file('file'),
            employeeId: $employeeId,
            categoryId: $request->input('document_category_id'),
            expiryDate: $request->input('expiry_date'),
            documentType: $request->input('document_type')
        );

        $document->signed_url = $this->documentService->getSignedUrl($document->id);

        return $this->successResponse(
            new DocumentResource($document),
            'Employee document uploaded successfully',
            201
        );
    }
}
