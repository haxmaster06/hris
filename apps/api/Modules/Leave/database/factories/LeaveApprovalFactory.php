<?php

declare(strict_types=1);

namespace Modules\Leave\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Leave\Models\LeaveApproval;
use Modules\Leave\Models\LeaveRequest;
use App\Models\User;

class LeaveApprovalFactory extends Factory
{
    protected $model = LeaveApproval::class;

    public function definition(): array
    {
        return [
            'leave_request_id' => LeaveRequest::factory(),
            'approver_id' => User::factory(),
            'status' => 'approved',
            'comments' => 'Approved by manager',
        ];
    }
}
