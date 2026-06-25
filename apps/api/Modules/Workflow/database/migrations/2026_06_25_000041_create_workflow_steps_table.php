<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workflow_definition_id');
            $table->integer('step_order');
            $table->string('name');
            $table->string('approver_type', 30); // role, specific_user, reports_to, department_head
            $table->uuid('approver_role_id')->nullable(); // jika type = role (Spatie role ID)
            $table->uuid('approver_user_id')->nullable(); // jika type = specific_user
            $table->text('condition_expression')->nullable(); // JSON: {"field": "amount", "operator": ">", "value": 5000000}
            $table->boolean('is_optional')->default(false);
            $table->integer('sla_hours')->nullable(); // batas waktu approval
            $table->string('on_timeout', 20)->default('escalate'); // escalate, auto_approve, auto_reject
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->cascadeOnDelete();
            $table->unique(['workflow_definition_id', 'step_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
    }
};
