<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interview_evaluations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('interview_id');
            $table->uuid('evaluator_id');
            $table->jsonb('criteria')->nullable(); // score of various parameters in JSON
            $table->decimal('overall_score', 4, 2);
            $table->string('recommendation', 20); // hire, reject, hold
            $table->text('comments')->nullable();

            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('interview_id')->references('id')->on('interviews')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_evaluations');
    }
};
