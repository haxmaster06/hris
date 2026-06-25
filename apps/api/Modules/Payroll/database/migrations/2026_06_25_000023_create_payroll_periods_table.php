<?php

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
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('month'); // 1-12
            $table->integer('year');
            $table->string('name')->nullable(); // "Januari 2026"
            $table->date('start_date');
            $table->date('end_date');
            $table->date('cut_off_date'); // tanggal batas data attendance/leave
            $table->date('payment_date')->nullable();
            $table->string('status', 20)->default('draft'); // draft, processing, calculated, approved, locked, paid
            $table->timestamp('processed_at')->nullable();
            $table->uuid('processed_by')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('locked_by')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
            $table->integer('version')->default(1);

            $table->unique(['month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_periods');
    }
};
