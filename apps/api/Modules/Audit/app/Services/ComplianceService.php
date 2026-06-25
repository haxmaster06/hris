<?php

declare(strict_types=1);

namespace Modules\Audit\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ComplianceService
{
    /**
     * Dapatkan karyawan kontrak yang masa kontraknya (end_date) berakhir kurang dari N hari.
     */
    public function getExpiringContracts(int $daysAhead): Collection
    {
        return DB::table('employees')
            ->where('employment_type', 'contract')
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [
                now()->toDateString(),
                now()->addDays($daysAhead)->toDateString()
            ])
            ->whereNull('deleted_at')
            ->get();
    }

    /**
     * Dapatkan sertifikasi karyawan (employee_certifications) yang masa berlakunya (expired_date) kurang dari N hari.
     */
    public function getExpiringCertifications(int $daysAhead): Collection
    {
        return DB::table('employee_certifications')
            ->join('employees', 'employee_certifications.employee_id', '=', 'employees.id')
            ->join('certifications', 'employee_certifications.certification_id', '=', 'certifications.id')
            ->whereNotNull('employee_certifications.expired_date')
            ->whereBetween('employee_certifications.expired_date', [
                now()->toDateString(),
                now()->addDays($daysAhead)->toDateString()
            ])
            ->whereNull('employee_certifications.deleted_at')
            ->whereNull('employees.deleted_at')
            ->select([
                'employee_certifications.*',
                'employees.first_name as employee_first_name',
                'employees.last_name as employee_last_name',
                'certifications.name as certification_name',
            ])
            ->get();
    }
}
