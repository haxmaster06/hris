<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disciplinary_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->string('case_number', 30)->unique();
            $table->string('category', 30); // attendance, conduct, performance, policy_violation, other
            $table->date('incident_date');
            $table->text('description');
            $table->text('evidence')->nullable();
            $table->string('severity', 20); // minor, moderate, major, critical
            $table->string('status', 20)->default('reported'); // reported, under_investigation, hearing, decided, closed, appealed
            $table->uuid('reported_by');
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disciplinary_cases');
    }
};
