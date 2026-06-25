<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->nullable(); // Null if anonymous
            $table->string('type', 20); // suggestion, complaint, appreciation, other
            $table->string('category', 30)->nullable(); // work_environment, management, policy, compensation, other
            $table->text('content');
            $table->boolean('is_anonymous')->default(false);
            $table->string('status', 20)->default('submitted'); // submitted, reviewed, in_progress, resolved, closed
            $table->text('response')->nullable();
            $table->uuid('responded_by')->nullable();
            $table->timestamp('responded_at')->nullable();

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
        Schema::dropIfExists('feedbacks');
    }
};
