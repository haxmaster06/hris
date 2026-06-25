<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->timestamp('original_check_in')->nullable();
            $table->timestamp('original_check_out')->nullable();
            $table->timestamp('corrected_check_in')->nullable();
            $table->timestamp('corrected_check_out')->nullable();
            $table->text('reason');
            $table->string('status', 20)->default('pending'); // pending, approved, rejected
            $table->uuid('approved_by')->nullable();

            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_corrections');
    }
};
