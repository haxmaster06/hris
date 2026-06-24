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
        Schema::create('interviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('job_application_id');
            $table->dateTime('interview_date');
            $table->uuid('interviewer_id'); // foreign key to users
            $table->text('notes')->nullable();
            $table->integer('score')->nullable(); // scale 1-100
            $table->string('status')->default('scheduled'); // scheduled, completed, cancelled

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
            $table->foreign('job_application_id')->references('id')->on('job_applications')->cascadeOnDelete();
            $table->foreign('interviewer_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
