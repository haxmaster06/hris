<?php

declare(strict_types=1);

namespace Modules\Report\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Employee\Models\Employee;
use Modules\Organization\Models\Department;
use Modules\Payroll\Models\PayrollRun;
use Modules\Training\Models\Training;
use Carbon\Carbon;

class ReportService
{
    public function turnoverReport(int $year): array
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $data = [];

        foreach ($months as $index => $month) {
            $monthNum = $index + 1;

            $hired = Employee::whereYear('join_date', $year)
                ->whereMonth('join_date', $monthNum)
                ->count();

            $terminated = Employee::where(function ($q) use ($year, $monthNum) {
                $q->whereYear('end_date', $year)
                  ->whereMonth('end_date', $monthNum);
            })->count();

            $data[] = [
                'month' => $month,
                'hired' => $hired,
                'terminated' => $terminated,
            ];
        }

        return $data;
    }

    public function retentionReport(int $year): array
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $data = [];

        foreach ($months as $index => $month) {
            $monthNum = $index + 1;
            $monthStartDate = Carbon::create($year, $monthNum, 1)->startOfMonth();
            $monthEndDate = Carbon::create($year, $monthNum, 1)->endOfMonth();

            // Headcount at start of month
            $startHeadcount = Employee::where('join_date', '<', $monthStartDate)
                ->where(function ($q) use ($monthStartDate) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $monthStartDate);
                })
                ->count();

            // Hired during month
            $hired = Employee::whereBetween('join_date', [$monthStartDate, $monthEndDate])->count();

            // Headcount at end of month
            $endHeadcount = Employee::where('join_date', '<=', $monthEndDate)
                ->where(function ($q) use ($monthEndDate) {
                    $q->whereNull('end_date')->orWhere('end_date', '>', $monthEndDate);
                })
                ->count();

            $retentionRate = 100.0;
            if ($startHeadcount > 0) {
                $retained = $endHeadcount - $hired;
                $retentionRate = ($retained / $startHeadcount) * 100;
                $retentionRate = min(100.0, max(0.0, round($retentionRate, 2)));
            }

            $data[] = [
                'month' => $month,
                'retention_rate' => $retentionRate,
            ];
        }

        return $data;
    }

    public function headcountReport(): array
    {
        $year = (int) date('Y');
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $data = [];

        foreach ($months as $index => $month) {
            $monthNum = $index + 1;
            $monthEndDate = Carbon::create($year, $monthNum, 1)->endOfMonth();

            $count = Employee::where('join_date', '<=', $monthEndDate)
                ->where(function ($q) use ($monthEndDate) {
                    $q->whereNull('end_date')->orWhere('end_date', '>', $monthEndDate);
                })
                ->count();

            $data[] = [
                'month' => $month,
                'headcount' => $count,
            ];
        }

        return $data;
    }

    public function workforceSummary(): array
    {
        // 1. Gender breakdown
        $genderData = Employee::select('gender', DB::raw('count(*) as count'))
            ->groupBy('gender')
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->gender ?: 'Unknown'),
                'value' => (int) $item->count,
            ])
            ->toArray();

        // 2. Status breakdown (Employment Type)
        $statusData = Employee::select('employment_type', DB::raw('count(*) as count'))
            ->groupBy('employment_type')
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->employment_type ?: 'Unknown'),
                'value' => (int) $item->count,
            ])
            ->toArray();

        // 3. Age Brackets
        $employees = Employee::whereNotNull('birth_date')->get();
        $ageBrackets = [
            '< 25' => 0,
            '25 - 34' => 0,
            '35 - 44' => 0,
            '45+' => 0,
        ];
        foreach ($employees as $emp) {
            $age = Carbon::parse($emp->birth_date)->age;
            if ($age < 25) {
                $ageBrackets['< 25']++;
            } elseif ($age <= 34) {
                $ageBrackets['25 - 34']++;
            } elseif ($age <= 44) {
                $ageBrackets['35 - 44']++;
            } else {
                $ageBrackets['45+']++;
            }
        }
        $ageData = [];
        foreach ($ageBrackets as $name => $count) {
            $ageData[] = ['name' => $name, 'value' => $count];
        }

        // 4. Tenure Brackets
        $tenureBrackets = [
            '< 1 Year' => 0,
            '1 - 3 Years' => 0,
            '3 - 5 Years' => 0,
            '5+ Years' => 0,
        ];
        foreach ($employees as $emp) {
            $tenure = Carbon::parse($emp->join_date)->diffInYears(Carbon::now());
            if ($tenure < 1) {
                $tenureBrackets['< 1 Year']++;
            } elseif ($tenure <= 3) {
                $tenureBrackets['1 - 3 Years']++;
            } elseif ($tenure <= 5) {
                $tenureBrackets['3 - 5 Years']++;
            } else {
                $tenureBrackets['5+ Years']++;
            }
        }
        $tenureData = [];
        foreach ($tenureBrackets as $name => $count) {
            $tenureData[] = ['name' => $name, 'value' => $count];
        }

        return [
            'gender' => $genderData,
            'status' => $statusData,
            'age' => $ageData,
            'tenure' => $tenureData,
        ];
    }

    public function costAnalysis(int $year): array
    {
        $runs = PayrollRun::join('employees', 'payroll_runs.employee_id', '=', 'employees.id')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->whereHas('payrollPeriod', function($q) use ($year) {
                $q->where('year', $year);
            })
            ->select('departments.name as department', DB::raw('SUM(payroll_runs.take_home_pay) as total_cost'))
            ->groupBy('departments.name')
            ->get();

        return $runs->map(fn($item) => [
            'department' => $item->department,
            'cost' => (float) $item->total_cost,
        ])->toArray();
    }

    public function trainingEffectiveness(): Collection
    {
        return Training::select('id', 'name', 'pre_test_score', 'post_test_score', 'effectiveness_rating')
            ->get()
            ->map(fn($t) => [
                'name' => $t->name,
                'pre_score' => $t->pre_test_score ? (float) $t->pre_test_score : 0.0,
                'post_score' => $t->post_test_score ? (float) $t->post_test_score : 0.0,
                'rating' => $t->effectiveness_rating ? (float) $t->effectiveness_rating : 0.0,
            ]);
    }
}
