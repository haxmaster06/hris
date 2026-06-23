<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->cleanupTenantDatabases();
    }

    protected function tearDown(): void
    {
        $this->cleanupTenantDatabases();
        parent::tearDown();
    }

    protected function cleanupTenantDatabases(): void
    {
        if (class_exists(\App\Models\Tenant::class)) {
            try {
                if (config('database.default') === 'pgsql') {
                    // Drop all tenant schemas starting with tenant_
                    $schemas = \Illuminate\Support\Facades\DB::select("
                        SELECT schema_name 
                        FROM information_schema.schemata 
                        WHERE schema_name LIKE 'tenant%';
                    ");
                    foreach ($schemas as $s) {
                        \Illuminate\Support\Facades\DB::statement("DROP SCHEMA IF EXISTS \"{$s->schema_name}\" CASCADE;");
                    }
                } else {
                    // Clean up by reading all possible sqlite tenant files in database folder
                    $databaseDir = database_path();
                    if (is_dir($databaseDir)) {
                        $files = glob($databaseDir . '/tenant*');
                        foreach ($files as $file) {
                            if (is_file($file)) {
                                @unlink($file);
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore errors
            }
        }
    }
}
