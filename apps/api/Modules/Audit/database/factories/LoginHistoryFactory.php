<?php

declare(strict_types=1);

namespace Modules\Audit\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Audit\Models\LoginHistory;
use App\Models\User;

class LoginHistoryFactory extends Factory
{
    protected $model = LoginHistory::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'ip_address' => $this->faker->ipv4(),
            'device' => 'Desktop',
            'browser' => 'Chrome',
            'os' => 'Windows',
            'location' => 'Jakarta, Indonesia',
            'status' => 'success',
            'login_at' => now(),
            'logout_at' => null,
            'is_new_device' => false,
        ];
    }
}
