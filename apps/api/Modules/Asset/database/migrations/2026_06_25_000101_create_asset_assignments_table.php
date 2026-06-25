<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('asset_id');
            $table->uuid('employee_id');
            $table->date('assigned_date');
            $table->date('expected_return_date')->nullable();
            $table->date('returned_date')->nullable();
            $table->string('condition_on_assign', 20)->default('good');
            $table->string('condition_on_return', 20)->nullable();
            $table->text('assign_notes')->nullable();
            $table->text('return_notes')->nullable();
            $table->string('bast_document_path')->nullable(); // Berita Acara Serah Terima
            $table->uuid('assigned_by');
            $table->uuid('received_by')->nullable();
            $table->string('status', 20)->default('active'); // active, returned, lost

            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('asset_id')->references('id')->on('assets')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_assignments');
    }
};
