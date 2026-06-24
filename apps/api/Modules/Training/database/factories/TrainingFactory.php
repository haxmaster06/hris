<?php

declare(strict_types=1);

namespace Modules\Training\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Training\Models\Training;

class TrainingFactory extends Factory
{
    protected $model = Training::class;

    public function definition(): array
    {
        $categories = ['Leadership', 'Technical', 'Safety', 'Compliance'];
        $types = ['Internal', 'External'];

        return [
            'name' => $this->faker->sentence(3),
            'code' => 'TRN-' . $this->faker->unique()->numberBetween(100, 999),
            'category' => $this->faker->randomElement($categories),
            'type' => $this->faker->randomElement($types),
            'description' => $this->faker->paragraph(),
            'version' => 1,
        ];
    }
}
