<?php

declare(strict_types=1);

namespace Modules\Talent\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Talent\Models\Skill;

class SkillFactory extends Factory
{
    protected $model = Skill::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(2, true) . ' Skill',
            'category' => $this->faker->randomElement(['hard_skill', 'soft_skill', 'technical', 'leadership', 'language']),
            'description' => $this->faker->sentence(),
            'is_active' => true,
            'version' => 1,
        ];
    }
}
