<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lifecycle_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('event_type', 30); // promotion, mutation, demotion, resignation, termination, retirement, contract_renewal, status_change
            $table->date('effective_date');
            
            // From/To positions
            $table->uuid('from_position_id')->nullable();
            $table->uuid('to_position_id')->nullable();
            
            // From/To departments
            $table->uuid('from_department_id')->nullable();
            $table->uuid('to_department_id')->nullable();
            
            // From/To branches
            $table->uuid('from_branch_id')->nullable();
            $table->uuid('to_branch_id')->nullable();
            
            // From/To divisions
            $table->uuid('from_division_id')->nullable();
            $table->uuid('to_division_id')->nullable();
            
            // From/To grades
            $table->uuid('from_grade_id')->nullable();
            $table->uuid('to_grade_id')->nullable();
            
            // From/To status/employment type
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20)->nullable();
            
            // From/To salary (for payroll integration)
            $table->decimal('from_salary', 15, 2)->nullable();
            $table->decimal('to_salary', 15, 2)->nullable();
            
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('document_path')->nullable();
            $table->string('status', 20)->default('draft'); // draft, pending_approval, approved, rejected, executed

            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
            $table->integer('version')->default(1);

            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('from_position_id')->references('id')->on('positions')->nullOnDelete();
            $table->foreign('to_position_id')->references('id')->on('positions')->nullOnDelete();
            $table->foreign('from_department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('to_department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('from_branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('to_branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('from_division_id')->references('id')->on('divisions')->nullOnDelete();
            $table->foreign('to_division_id')->references('id')->on('divisions')->nullOnDelete();
            $table->foreign('from_grade_id')->references('id')->on('grades')->nullOnDelete();
            $table->foreign('to_grade_id')->references('id')->on('grades')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lifecycle_events');
    }
};
