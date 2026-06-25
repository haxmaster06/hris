<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('succession_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('position_id');
            $table->uuid('incumbent_employee_id')->nullable();
            $table->uuid('candidate_employee_id');
            $table->string('readiness_level', 20); // ready_now, ready_1_year, ready_2_years, development_needed
            $table->decimal('potential_score', 5, 2)->nullable();
            $table->decimal('performance_score', 5, 2)->nullable();
            $table->json('development_actions')->nullable(); // contains [{action, deadline, status}]
            $table->text('notes')->nullable();
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('position_id')->references('id')->on('positions')->onDelete('cascade');
            $table->foreign('incumbent_employee_id')->references('id')->on('employees')->onDelete('set null');
            $table->foreign('candidate_employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('succession_plans');
    }
};
