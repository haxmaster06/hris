<?php

declare(strict_types=1);

namespace Modules\Asset\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Asset\Models\Asset;
use Modules\Asset\Models\AssetAssignment;
use Modules\Employee\Models\Employee;

class AssetAssignmentFactory extends Factory
{
    protected $model = AssetAssignment::class;

    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'employee_id' => Employee::factory(),
            'assigned_date' => now()->toDateString(),
            'expected_return_date' => now()->addMonths(6)->toDateString(),
            'returned_date' => null,
            'condition_on_assign' => 'good',
            'condition_on_return' => null,
            'assign_notes' => $this->faker->sentence(),
            'return_notes' => null,
            'bast_document_path' => null,
            'assigned_by' => Employee::factory(),
            'received_by' => null,
            'status' => 'active',
            'version' => 1,
        ];
    }
}
