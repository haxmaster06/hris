<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('asset_number', 30)->unique();
            $table->string('name');
            $table->string('category', 30); // laptop, desktop, monitor, phone, tablet, sim_card, vehicle, furniture, other
            $table->string('brand', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->text('specifications')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->string('vendor', 100)->nullable();
            $table->string('condition', 20)->default('good'); // new, good, fair, poor, damaged
            $table->string('status', 20)->default('available'); // available, assigned, maintenance, disposed, lost
            $table->string('location')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->text('notes')->nullable();

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
        Schema::dropIfExists('assets');
    }
};
