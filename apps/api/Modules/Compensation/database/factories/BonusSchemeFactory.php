<?php

declare(strict_types=1);

namespace Modules\Compensation\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Compensation\Models\BonusScheme;

class BonusSchemeFactory extends Factory
{
    protected $model = BonusScheme::class;

    public function definition(): array
    {
        $calcType = $this->faker->randomElement(['percentage', 'fixed_amount']);
        $value = $calcType === 'percentage' ? $this->faker->randomFloat(2, 1, 20) : $this->faker->randomFloat(2, 500000, 10000000);
        
        return [
            'name' => $this->faker->words(3, true),
            'type' => $this->faker->randomElement(['performance', 'annual', 'project', 'referral', 'other']),
            'calculation_type' => $calcType,
            'value' => $value,
            'description' => $this->faker->sentence(),
            'is_active' => true,
            'version' => 1,
        ];
    }
}
