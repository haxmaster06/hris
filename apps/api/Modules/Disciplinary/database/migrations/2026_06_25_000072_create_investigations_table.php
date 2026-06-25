<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investigations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('disciplinary_case_id');
            $table->uuid('investigator_id');
            $table->text('findings')->nullable();
            $table->text('recommendation')->nullable();
            $table->text('committee_notes')->nullable();
            $table->string('status', 20)->default('in_progress'); // in_progress, completed
            $table->timestamp('completed_at')->nullable();
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('disciplinary_case_id')->references('id')->on('disciplinary_cases')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investigations');
    }
};
