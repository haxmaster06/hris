<?php

declare(strict_types=1);

namespace Modules\Certification\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Certification\Models\Certification;
use Modules\Certification\Models\EmployeeCertification;
use Modules\Employee\Models\Employee;

class EmployeeCertificationFactory extends Factory
{
    protected $model = EmployeeCertification::class;

    public function definition(): array
    {
        $issueDate = $this->faker->dateTimeBetween('-2 years', '-1 month');
        $expiredDate = (clone $issueDate)->modify('+1 year');
        $statuses = ['Active', 'Expired', 'Pending_Renewal'];

        return [
            'employee_id' => Employee::factory(),
            'certification_id' => Certification::factory(),
            'certificate_number' => 'CERT/' . $this->faker->numberBetween(10000, 99999),
            'issue_date' => $issueDate,
            'expired_date' => $expiredDate,
            'document_path' => 'certifications/' . $this->faker->uuid() . '.pdf',
            'status' => $this->faker->randomElement($statuses),
            'version' => 1,
        ];
    }
}
