<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('performance_period_id');
            $table->uuid('employee_id');
            $table->decimal('kpi_score', 5, 2)->nullable();
            $table->decimal('self_score', 5, 2)->nullable();
            $table->text('self_comment')->nullable();
            $table->decimal('manager_score', 5, 2)->nullable();
            $table->text('manager_comment')->nullable();
            $table->uuid('manager_id')->nullable();
            $table->decimal('hr_score', 5, 2)->nullable();
            $table->text('hr_comment')->nullable();
            $table->uuid('hr_reviewer_id')->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('rating', 20)->nullable(); // exceptional, exceeds, meets, below, unsatisfactory
            $table->string('status', 20)->default('pending'); // pending, self_review, manager_review, hr_review, calibration, completed
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('performance_period_id')->references('id')->on('performance_periods')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->unique(['performance_period_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
