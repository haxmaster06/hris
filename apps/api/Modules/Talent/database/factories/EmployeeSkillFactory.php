<?php

declare(strict_types=1);

namespace Modules\Talent\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Talent\Models\EmployeeSkill;
use Modules\Employee\Models\Employee;
use Modules\Talent\Models\Skill;

class EmployeeSkillFactory extends Factory
{
    protected $model = EmployeeSkill::class;

    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'skill_id' => Skill::factory(),
            'proficiency_level' => $this->faker->numberBetween(1, 5),
            'assessed_at' => $this->faker->dateTimeThisYear()->format('Y-m-d'),
            'assessed_by' => Employee::factory(),
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
