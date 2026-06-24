<?php

declare(strict_types=1);

namespace Modules\Certification\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Certification\Models\Certification;
use Modules\Certification\Models\CertificationRequirement;
use Modules\Organization\Models\Position;

class CertificationRequirementFactory extends Factory
{
    protected $model = CertificationRequirement::class;

    public function definition(): array
    {
        return [
            'position_id' => Position::factory(),
            'certification_id' => Certification::factory(),
            'is_mandatory' => $this->faker->boolean(80), // 80% chance of being mandatory
            'version' => 1,
        ];
    }
}
