<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 20); // satisfaction, pulse, engagement, custom
            $table->string('status', 20)->default('draft'); // draft, published, closed, archived
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->string('target_audience', 20)->default('all'); // all, department, position, custom
            $table->jsonb('target_ids')->nullable(); // department_ids or position_ids
            
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
        Schema::dropIfExists('surveys');
    }
};
