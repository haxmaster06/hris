<?php

declare(strict_types=1);

namespace Modules\Disciplinary\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Modules\Disciplinary\Models\DisciplinaryCase;
use Modules\Disciplinary\Models\DisciplinaryAction;
use Carbon\Carbon;

class DisciplinaryCaseController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('disciplinary.cases.read');

        $query = DisciplinaryCase::query()->with(['employee', 'reporter', 'investigation', 'actions']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        $cases = $query->paginate($request->integer('per_page', 15));

        return $this->successResponse($cases, 'Disciplinary cases retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('disciplinary.cases.create');

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'category' => 'required|string|in:attendance,conduct,performance,policy_violation,other',
            'incident_date' => 'required|date',
            'description' => 'required|string',
            'evidence' => 'nullable|array',
            'severity' => 'required|string|in:minor,moderate,major,critical',
            'reported_by' => 'required|uuid|exists:employees,id',
        ]);

        $year = now()->format('Y');
        $month = now()->format('m');
        $prefix = "CASE/{$year}/{$month}/";
        $latest = DisciplinaryCase::where('case_number', 'like', "{$prefix}%")
            ->orderBy('case_number', 'desc')
            ->first();
        $increment = 1;
        if ($latest) {
            $parts = explode('/', $latest->case_number);
            $increment = ((int) end($parts)) + 1;
        }
        $caseNumber = $prefix . str_pad((string) $increment, 4, '0', STR_PAD_LEFT);

        $case = DisciplinaryCase::create(array_merge($validated, [
            'case_number' => $caseNumber,
            'status' => 'reported',
        ]));

        return $this->createdResponse($case, 'Disciplinary case reported successfully.');
    }

    public function show(string $id): JsonResponse
    {
        Gate::authorize('disciplinary.cases.read');

        $case = DisciplinaryCase::with(['employee', 'reporter', 'investigation', 'actions.issuer', 'actions.acknowledger'])
            ->findOrFail($id);

        return $this->successResponse($case, 'Disciplinary case retrieved successfully.');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        Gate::authorize('disciplinary.cases.update');

        $case = DisciplinaryCase::findOrFail($id);

        $validated = $request->validate([
            'category' => 'required|string|in:attendance,conduct,performance,policy_violation,other',
            'incident_date' => 'required|date',
            'description' => 'required|string',
            'evidence' => 'nullable|array',
            'severity' => 'required|string|in:minor,moderate,major,critical',
            'status' => 'required|string|in:reported,under_investigation,hearing,decided,closed,appealed',
        ]);

        $case->update($validated);

        return $this->successResponse($case, 'Disciplinary case updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('disciplinary.cases.delete');

        $case = DisciplinaryCase::findOrFail($id);
        $case->delete();

        return $this->successResponse(null, 'Disciplinary case deleted successfully.');
    }

    public function issueAction(Request $request, string $id): JsonResponse
    {
        Gate::authorize('disciplinary.actions.create');

        $case = DisciplinaryCase::findOrFail($id);

        $validated = $request->validate([
            'action_type' => 'required|string|in:verbal_warning,sp1,sp2,sp3,suspension,termination',
            'effective_date' => 'required|date',
            'expiry_date' => 'nullable|date',
            'description' => 'required|string',
            'issued_by' => 'required|uuid|exists:employees,id',
            'document_path' => 'nullable|string',
        ]);

        $effectiveDate = Carbon::parse($validated['effective_date']);
        $expiryDate = $validated['expiry_date'] ? Carbon::parse($validated['expiry_date']) : null;

        if (in_array($validated['action_type'], ['sp1', 'sp2', 'sp3']) && !$expiryDate) {
            $expiryDate = $effectiveDate->copy()->addMonths(6);
        }

        $action = DB::transaction(function () use ($case, $validated, $expiryDate) {
            $act = DisciplinaryAction::create(array_merge($validated, [
                'disciplinary_case_id' => $case->id,
                'expiry_date' => $expiryDate ? $expiryDate->toDateString() : null,
            ]));

            $case->update(['status' => 'decided']);

            return $act;
        });

        return $this->createdResponse($action, 'Disciplinary action issued successfully.');
    }
}
