<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disciplinary_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('disciplinary_case_id');
            $table->string('action_type', 20); // verbal_warning, sp1, sp2, sp3, suspension, termination
            $table->date('effective_date');
            $table->date('expiry_date')->nullable();
            $table->text('description');
            $table->uuid('issued_by');
            $table->string('document_path')->nullable();
            $table->uuid('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            
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
        Schema::dropIfExists('disciplinary_actions');
    }
};
