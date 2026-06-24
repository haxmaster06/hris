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
        Schema::create('training_participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('training_session_id');
            $table->uuid('employee_id');
            $table->string('attendance_status')->default('Pending'); // Pending, Attended, Absent
            $table->string('result_status')->default('Pending');     // Pending, Pass, Fail
            $table->decimal('score', 5, 2)->nullable();
            $table->text('remarks')->nullable();

            // Audit and standard fields
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
            $table->integer('version')->default(1);

            // Indexes
            $table->index('created_at');
            $table->index('deleted_at');
            $table->index('attendance_status');
            $table->index('result_status');

            // Unique constraint to prevent duplicate enrollment in the same session
            $table->unique(['training_session_id', 'employee_id']);

            // Foreign keys
            $table->foreign('training_session_id')->references('id')->on('training_sessions')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_participants');
    }
};
