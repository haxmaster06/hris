<?php

declare(strict_types=1);

namespace Modules\Recruitment\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Recruitment\Models\Vacancy;
use Modules\Organization\Models\Company;
use Modules\Organization\Models\Branch;
use Modules\Organization\Models\Department;
use Modules\Organization\Models\Position;

class VacancyFactory extends Factory
{
    protected $model = Vacancy::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'branch_id' => Branch::factory(),
            'department_id' => Department::factory(),
            'position_id' => Position::factory(),
            'title' => $this->faker->jobTitle(),
            'description' => $this->faker->paragraph(),
            'requirements' => $this->faker->paragraph(),
            'slots' => $this->faker->numberBetween(1, 5),
            'status' => 'draft',
        ];
    }
}
