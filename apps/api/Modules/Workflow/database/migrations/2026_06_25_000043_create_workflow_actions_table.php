<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_actions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_instance_id');
            $table->uuid('workflow_step_id');
            $table->integer('step_order');
            $table->uuid('actor_id');
            $table->string('action', 20); // approve, reject, return, delegate
            $table->text('comment')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('workflow_instance_id')->references('id')->on('workflow_instances')->cascadeOnDelete();
            $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_actions');
    }
};
