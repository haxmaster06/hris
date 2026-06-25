<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('survey_response_id');
            $table->uuid('survey_question_id');
            $table->text('answer_text')->nullable();
            $table->jsonb('answer_choices')->nullable(); // For multiple-choice questions

            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('survey_response_id')->references('id')->on('survey_responses')->cascadeOnDelete();
            $table->foreign('survey_question_id')->references('id')->on('survey_questions')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_answers');
    }
};
