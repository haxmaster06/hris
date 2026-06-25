<?php

declare(strict_types=1);

namespace Modules\Organization\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Organization\Models\CostCenter;
use Modules\Organization\Models\Company;

class CostCenterFactory extends Factory
{
    protected $model = CostCenter::class;

    public function definition(): array
    {
        return [
            'code' => 'CC-' . $this->faker->unique()->numerify('####'),
            'name' => $this->faker->company() . ' Cost Center',
            'description' => $this->faker->sentence(),
            'company_id' => Company::factory(),
            'is_active' => true,
        ];
    }
}
