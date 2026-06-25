<?php

declare(strict_types=1);

namespace Modules\Audit\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Audit\Models\AuditLog;
use App\Models\User;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'user_name' => $this->faker->name(),
            'action' => $this->faker->randomElement(['created', 'updated', 'deleted']),
            'auditable_type' => 'Modules\\Employee\\Models\\Employee',
            'auditable_id' => $this->faker->uuid(),
            'auditable_label' => $this->faker->name(),
            'old_values' => null,
            'new_values' => ['name' => $this->faker->name()],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'module' => 'Employee',
            'created_at' => now(),
        ];
    }
}
