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
        Schema::create('leave_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('leave_request_id');
            $table->uuid('approver_id'); // foreign key to users
            $table->string('status'); // approved, rejected
            $table->string('comments')->nullable();

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
            $table->index('status');

            // Foreign keys
            $table->foreign('leave_request_id')->references('id')->on('leave_requests')->cascadeOnDelete();
            $table->foreign('approver_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_approvals');
    }
};
