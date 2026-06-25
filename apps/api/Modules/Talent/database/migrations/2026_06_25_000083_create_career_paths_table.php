<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('career_paths', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_position_id');
            $table->uuid('to_position_id');
            $table->string('path_type', 20); // promotion, lateral, specialization
            $table->integer('typical_years')->nullable(); // estimasi tahun untuk mencapai
            $table->json('requirements')->nullable(); // contains [{type: 'certification', id: '...', name: '...'}, {type: 'skill', ...}]
            $table->text('description')->nullable();
            
            // Universal fields
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->foreign('from_position_id')->references('id')->on('positions')->onDelete('cascade');
            $table->foreign('to_position_id')->references('id')->on('positions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_paths');
    }
};
