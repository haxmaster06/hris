<?php

declare(strict_types=1);

namespace Modules\Certification\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Certification\Models\Certification;

class CertificationFactory extends Factory
{
    protected $model = Certification::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(2) . ' Certification',
            'code' => 'CRT-' . $this->faker->unique()->numberBetween(100, 999),
            'issuer' => $this->faker->company() . ' Authority',
            'validity_period' => $this->faker->randomElement([12, 24, 36, 60]), // validity in months
            'version' => 1,
        ];
    }
}
