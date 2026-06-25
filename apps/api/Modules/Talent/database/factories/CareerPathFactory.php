<?php

declare(strict_types=1);

namespace Modules\Talent\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Talent\Models\CareerPath;
use Modules\Organization\Models\Position;

class CareerPathFactory extends Factory
{
    protected $model = CareerPath::class;

    public function definition(): array
    {
        return [
            'from_position_id' => Position::factory(),
            'to_position_id' => Position::factory(),
            'path_type' => $this->faker->randomElement(['promotion', 'lateral', 'specialization']),
            'typical_years' => $this->faker->numberBetween(1, 5),
            'requirements' => [],
            'description' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
