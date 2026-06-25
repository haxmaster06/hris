<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 30); // bank_export, notification, biometric, accounting
            $table->string('provider', 50); // mandiri, bca, bri, bni, whatsapp, email
            $table->string('name');
            $table->text('config'); // encrypted JSON payload or text
            $table->boolean('is_active')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_configs');
    }
};
