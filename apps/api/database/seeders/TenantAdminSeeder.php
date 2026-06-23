<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenantAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate([
            'email' => 'admin@nexushr.local',
        ], [
            'name' => 'Tenant Super Admin',
            'password' => Hash::make('admin123'),
        ]);

        // Assign default Super Admin role
        $admin->assignRole('Super Admin');
    }
}
