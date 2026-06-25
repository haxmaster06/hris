<?php

declare(strict_types=1);

namespace Modules\Engagement\Http\Controllers;

use App\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Engagement\Models\Feedback;
use Carbon\Carbon;

class FeedbackController extends BaseController
{
    /**
     * Get list of suggestion boxes.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('feedback.view');

        $query = Feedback::query()->with('employee');

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $feedbacks = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->successResponse($feedbacks, 'Feedbacks retrieved successfully.');
    }

    /**
     * Submit a suggestion or complaint.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('feedback.create');

        $validated = $request->validate([
            'employee_id' => 'nullable|uuid|exists:employees,id',
            'type' => 'required|string|in:suggestion,complaint,appreciation,other',
            'category' => 'nullable|string|in:work_environment,management,policy,compensation,other',
            'content' => 'required|string',
            'is_anonymous' => 'boolean',
        ]);

        if (!empty($validated['is_anonymous'])) {
            $validated['employee_id'] = null;
        } else {
            $validated['employee_id'] = $validated['employee_id'] ?? auth()->user()?->employee_id;
        }

        $feedback = Feedback::create($validated);

        return $this->createdResponse($feedback, 'Feedback submitted successfully.');
    }

    /**
     * View single feedback item.
     */
    public function show(string $id): JsonResponse
    {
        Gate::authorize('feedback.view');

        $feedback = Feedback::with('employee')->findOrFail($id);

        return $this->successResponse($feedback, 'Feedback retrieved successfully.');
    }

    /**
     * HR respond to feedback.
     */
    public function respond(Request $request, string $id): JsonResponse
    {
        Gate::authorize('feedback.respond');

        $feedback = Feedback::findOrFail($id);

        $validated = $request->validate([
            'response' => 'required|string',
            'status' => 'required|string|in:reviewed,in_progress,resolved,closed',
            'responded_by' => 'required|uuid|exists:employees,id',
        ]);

        $feedback->update([
            'response' => $validated['response'],
            'status' => $validated['status'],
            'responded_by' => $validated['responded_by'],
            'responded_at' => Carbon::now(),
        ]);

        return $this->successResponse($feedback, 'Feedback responded successfully.');
    }

    /**
     * Delete feedback.
     */
    public function destroy(string $id): JsonResponse
    {
        Gate::authorize('feedback.respond');

        $feedback = Feedback::findOrFail($id);
        $feedback->delete();

        return $this->successResponse(null, 'Feedback deleted successfully.');
    }
}
