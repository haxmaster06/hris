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
            
            // Employee
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'employee.history.read',
            
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
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'employee.history.read',
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
        ]);
    }
}
