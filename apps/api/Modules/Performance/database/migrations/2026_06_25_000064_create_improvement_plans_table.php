<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('improvement_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->uuid('performance_review_id')->nullable();
            $table->string('title');
            $table->text('reason');
            $table->json('action_items'); // contains [{task, deadline, status}]
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 20)->default('active'); // active, extended, completed, failed
            $table->uuid('supervisor_id');
            $table->text('outcome_notes')->nullable();
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('performance_review_id')->references('id')->on('performance_reviews')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('improvement_plans');
    }
};
