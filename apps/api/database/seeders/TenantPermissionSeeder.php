<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class TenantPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Default permissions list (format: module.action.scope)
        $permissions = [
            // Central / IAM
            'core.users.create', 'core.users.read', 'core.users.update', 'core.users.delete',
            'core.roles.create', 'core.roles.read', 'core.roles.update', 'core.roles.delete',
            
            // Organization
            'organization.companies.create', 'organization.companies.read', 'organization.companies.update', 'organization.companies.delete',
            'organization.branches.create', 'organization.branches.read', 'organization.branches.update', 'organization.branches.delete',
            'organization.departments.create', 'organization.departments.read', 'organization.departments.update', 'organization.departments.delete',
            'organization.divisions.create', 'organization.divisions.read', 'organization.divisions.update', 'organization.divisions.delete',
            'organization.positions.create', 'organization.positions.read', 'organization.positions.update', 'organization.positions.delete',
            'organization.grades.create', 'organization.grades.read', 'organization.grades.update', 'organization.grades.delete',
            'organization.cost_centers.create', 'organization.cost_centers.read', 'organization.cost_centers.update', 'organization.cost_centers.delete',
            
            // Employee
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'employee.history.read',
            
            // Employee Lifecycle & Onboarding
            'lifecycle_event.create', 'lifecycle_event.read', 'lifecycle_event.update', 'lifecycle_event.delete', 'lifecycle_event.execute',
            'onboarding.create', 'onboarding.read', 'onboarding.update', 'onboarding.delete',
            
            // Attendance
            'shift.create', 'shift.read', 'shift.update', 'shift.delete',
            'employee_shift.create', 'employee_shift.read', 'employee_shift.update', 'employee_shift.delete',
            'attendance.read', 'attendance.create', 'attendance.update', 'attendance.delete',
            
            // Leave
            'leave_type.create', 'leave_type.read', 'leave_type.update', 'leave_type.delete',
            'leave.create', 'leave.read', 'leave.update', 'leave.delete',

            // Document
            'document_category.create', 'document_category.read', 'document_category.update', 'document_category.delete',
            'document.create', 'document.read', 'document.delete',

            // Report
            'report.employee', 'report.attendance', 'report.leave',

            // Recruitment
            'recruitment.vacancy.create', 'recruitment.vacancy.read', 'recruitment.vacancy.update', 'recruitment.vacancy.delete',
            'recruitment.candidate.create', 'recruitment.candidate.read', 'recruitment.candidate.update', 'recruitment.candidate.delete',
            'recruitment.application.create', 'recruitment.application.read', 'recruitment.application.update', 'recruitment.application.delete',
            'recruitment.interview.create', 'recruitment.interview.read', 'recruitment.interview.update', 'recruitment.interview.delete',
            'recruitment.approval.create', 'recruitment.approval.read', 'recruitment.approval.update', 'recruitment.approval.delete',

            // Training & Certification
            'training.create', 'training.read', 'training.update', 'training.delete',
            'certification.create', 'certification.read', 'certification.update', 'certification.delete',

            // Payroll & Compensation (Fase 2)
            'payroll.read', 'payroll.write',

            // Workflow, Audit & Security (Fase 3)
            'workflow.definitions.read', 'workflow.definitions.create', 'workflow.definitions.update', 'workflow.definitions.delete',
            'workflow.instances.read', 'workflow.instances.approve',
            'audit.logs.read', 'audit.login_history.read', 'audit.compliance.read',

            // Performance (Fase 4)
            'performance.kpi.create', 'performance.kpi.read', 'performance.kpi.update', 'performance.kpi.delete',
            'performance.reviews.create', 'performance.reviews.read', 'performance.reviews.update', 'performance.reviews.delete',
            'performance.pip.create', 'performance.pip.read', 'performance.pip.update', 'performance.pip.delete',

            // Disciplinary (Fase 4)
            'disciplinary.cases.create', 'disciplinary.cases.read', 'disciplinary.cases.update', 'disciplinary.cases.delete',
            'disciplinary.investigations.create', 'disciplinary.investigations.read', 'disciplinary.investigations.update', 'disciplinary.investigations.delete',
            'disciplinary.actions.create', 'disciplinary.actions.read', 'disciplinary.actions.update', 'disciplinary.actions.delete',

            // Talent (Fase 4)
            'talent.skills.create', 'talent.skills.read', 'talent.skills.update', 'talent.skills.delete',
            'talent.career_paths.create', 'talent.career_paths.read', 'talent.career_paths.update', 'talent.career_paths.delete',
            'talent.succession.create', 'talent.succession.read', 'talent.succession.update', 'talent.succession.delete',

            // Engagement (Fase 5)
            'survey.view', 'survey.create', 'survey.update', 'survey.delete', 'survey.respond',
            'feedback.view', 'feedback.create', 'feedback.respond',
            'award.view', 'award.create', 'award.delete',

            // Asset (Fase 5)
            'asset.view', 'asset.create', 'asset.update', 'asset.delete',
            'asset_assignment.view', 'asset_assignment.create', 'asset_assignment.return',

            // Attendance Gaps (Fase 5)
            'attendance_correction.view', 'attendance_correction.create', 'attendance_correction.approve',
            'overtime.view', 'overtime.create', 'overtime.approve',

            // Leave Gaps (Fase 5)
            'holiday.view', 'holiday.create', 'holiday.update', 'holiday.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'api',
            ]);
        }

        // Create Roles and Assign Permissions
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'api']);
        $superAdminRole->syncPermissions(Permission::all());

        $hrManagerRole = Role::firstOrCreate(['name' => 'HR Manager', 'guard_name' => 'api']);
        $hrManagerRole->syncPermissions([
            'core.users.read',
            'organization.companies.read',
            'organization.branches.read', 'organization.branches.update',
            'organization.departments.create', 'organization.departments.read', 'organization.departments.update',
            'organization.divisions.create', 'organization.divisions.read', 'organization.divisions.update',
            'organization.positions.create', 'organization.positions.read', 'organization.positions.update',
            'organization.grades.create', 'organization.grades.read', 'organization.grades.update',
            'organization.cost_centers.create', 'organization.cost_centers.read', 'organization.cost_centers.update', 'organization.cost_centers.delete',
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'employee.history.read',
            'lifecycle_event.create', 'lifecycle_event.read', 'lifecycle_event.update', 'lifecycle_event.delete', 'lifecycle_event.execute',
            'onboarding.create', 'onboarding.read', 'onboarding.update', 'onboarding.delete',
            'shift.create', 'shift.read', 'shift.update', 'shift.delete',
            'employee_shift.create', 'employee_shift.read', 'employee_shift.update', 'employee_shift.delete',
            'attendance.read', 'attendance.update',
            'leave_type.create', 'leave_type.read', 'leave_type.update', 'leave_type.delete',
            'leave.read', 'leave.update', 'leave.delete',
            'document_category.create', 'document_category.read', 'document_category.update', 'document_category.delete',
            'document.create', 'document.read', 'document.delete',
            'report.employee', 'report.attendance', 'report.leave',
            'recruitment.vacancy.create', 'recruitment.vacancy.read', 'recruitment.vacancy.update', 'recruitment.vacancy.delete',
            'recruitment.candidate.create', 'recruitment.candidate.read', 'recruitment.candidate.update', 'recruitment.candidate.delete',
            'recruitment.application.create', 'recruitment.application.read', 'recruitment.application.update', 'recruitment.application.delete',
            'recruitment.interview.create', 'recruitment.interview.read', 'recruitment.interview.update', 'recruitment.interview.delete',
            'recruitment.approval.create', 'recruitment.approval.read', 'recruitment.approval.update', 'recruitment.approval.delete',
            'training.create', 'training.read', 'training.update', 'training.delete',
            'certification.create', 'certification.read', 'certification.update', 'certification.delete',
            'payroll.read', 'payroll.write',
            'workflow.definitions.read', 'workflow.definitions.create', 'workflow.definitions.update', 'workflow.definitions.delete',
            'workflow.instances.read', 'workflow.instances.approve',
            'audit.logs.read', 'audit.login_history.read', 'audit.compliance.read',
            
            // Fase 4
            'performance.kpi.create', 'performance.kpi.read', 'performance.kpi.update', 'performance.kpi.delete',
            'performance.reviews.create', 'performance.reviews.read', 'performance.reviews.update', 'performance.reviews.delete',
            'performance.pip.create', 'performance.pip.read', 'performance.pip.update', 'performance.pip.delete',
            'disciplinary.cases.create', 'disciplinary.cases.read', 'disciplinary.cases.update', 'disciplinary.cases.delete',
            'disciplinary.investigations.create', 'disciplinary.investigations.read', 'disciplinary.investigations.update', 'disciplinary.investigations.delete',
            'disciplinary.actions.create', 'disciplinary.actions.read', 'disciplinary.actions.update', 'disciplinary.actions.delete',
            'talent.skills.create', 'talent.skills.read', 'talent.skills.update', 'talent.skills.delete',
            'talent.career_paths.create', 'talent.career_paths.read', 'talent.career_paths.update', 'talent.career_paths.delete',
            'talent.succession.create', 'talent.succession.read', 'talent.succession.update', 'talent.succession.delete',

            // Fase 5
            'survey.view', 'survey.create', 'survey.update', 'survey.delete', 'survey.respond',
            'feedback.view', 'feedback.create', 'feedback.respond',
            'award.view', 'award.create', 'award.delete',
            'asset.view', 'asset.create', 'asset.update', 'asset.delete',
            'asset_assignment.view', 'asset_assignment.create', 'asset_assignment.return',
            'attendance_correction.view', 'attendance_correction.create', 'attendance_correction.approve',
            'overtime.view', 'overtime.create', 'overtime.approve',
            'holiday.view', 'holiday.create', 'holiday.update', 'holiday.delete',
        ]);

        $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'api']);
        $employeeRole->syncPermissions([
            'organization.companies.read',
            'organization.branches.read',
            'organization.departments.read',
            'organization.divisions.read',
            'organization.positions.read',
            'organization.grades.read',
            'employee.read',
            'attendance.create', 'attendance.read',
            'leave.create', 'leave.read',
            'document.read',

            // Fase 5 Employee Gaps
            'survey.respond',
            'feedback.create', 'feedback.view',
            'award.view',
            'asset_assignment.view',
            'attendance_correction.create', 'attendance_correction.view',
            'overtime.create', 'overtime.view',
            'holiday.view',
        ]);
    }
}
