<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

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
            'organization.companies.read', 'organization.companies.update',
            'organization.branches.create', 'organization.branches.read', 'organization.branches.update', 'organization.branches.delete',
            'organization.departments.create', 'organization.departments.read', 'organization.departments.update', 'organization.departments.delete',
            'organization.positions.create', 'organization.positions.read', 'organization.positions.update', 'organization.positions.delete',
            
            // Employee
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'employee.history.read',
            
            // Attendance
            'attendance.checkin', 'attendance.checkout',
            'attendance.read.own', 'attendance.read.all',
            'attendance.update', 'attendance.delete',
            
            // Leave
            'leave.apply', 'leave.view.own', 'leave.view.all',
            'leave.approve', 'leave.reject', 'leave.update', 'leave.delete',
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
            'organization.positions.create', 'organization.positions.read', 'organization.positions.update',
            'employee.create', 'employee.read', 'employee.update', 'employee.delete',
            'employee.history.read',
            'attendance.read.all', 'attendance.update',
            'leave.view.all', 'leave.approve', 'leave.reject',
        ]);

        $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'api']);
        $employeeRole->syncPermissions([
            'organization.companies.read',
            'organization.branches.read',
            'organization.departments.read',
            'organization.positions.read',
            'employee.read',
            'attendance.checkin', 'attendance.checkout', 'attendance.read.own',
            'leave.apply', 'leave.view.own',
        ]);
    }
}
