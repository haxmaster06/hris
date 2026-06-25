<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('kpi_id');
            $table->uuid('employee_id');
            $table->uuid('performance_period_id');
            $table->decimal('target_value', 15, 2);
            $table->decimal('actual_value', 15, 2)->nullable();
            $table->decimal('weight', 5, 2)->default(0);
            $table->decimal('score', 5, 2)->nullable();
            $table->text('notes')->nullable();
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('kpi_id')->references('id')->on('kpis')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('performance_period_id')->references('id')->on('performance_periods')->onDelete('cascade');
            $table->unique(['kpi_id', 'employee_id', 'performance_period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_assignments');
    }
};
