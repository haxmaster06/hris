<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpis', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 30)->nullable(); // financial, customer, process, learning
            $table->string('unit', 20); // percentage, number, currency, boolean
            $table->string('measurement_type', 20)->default('higher_better'); // higher_better, lower_better, target_exact
            $table->uuid('position_id')->nullable();
            $table->boolean('is_active')->default(true);
            
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
        Schema::dropIfExists('kpis');
    }
};
