<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->uuid('division_id')->nullable()->after('department_id');
            $table->uuid('grade_id')->nullable()->after('position_id');
            $table->uuid('reports_to')->nullable()->after('grade_id');
            $table->string('phone', 20)->nullable()->after('gender');
            $table->string('email')->nullable()->after('phone');
            $table->string('id_number', 30)->nullable()->after('email'); // KTP
            $table->string('tax_number', 30)->nullable()->after('id_number'); // NPWP
            $table->string('blood_type', 5)->nullable()->after('birth_date');
            $table->string('religion', 20)->nullable()->after('blood_type');
            $table->string('marital_status', 20)->nullable()->after('religion');
            $table->text('address')->nullable()->after('marital_status');
            $table->string('city', 100)->nullable()->after('address');
            $table->string('province', 100)->nullable()->after('city');
            $table->string('postal_code', 10)->nullable()->after('province');
            $table->date('end_date')->nullable()->after('join_date');
            $table->string('employment_type', 20)->default('permanent')->after('status'); // permanent, contract, internship, outsource
            $table->string('photo_url')->nullable()->after('employment_type');

            $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
            $table->foreign('grade_id')->references('id')->on('grades')->nullOnDelete();
            $table->foreign('reports_to')->references('id')->on('employees')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['employees_division_id_foreign']);
            $table->dropForeign(['employees_grade_id_foreign']);
            $table->dropForeign(['employees_reports_to_foreign']);

            $table->dropColumn([
                'division_id',
                'grade_id',
                'reports_to',
                'phone',
                'email',
                'id_number',
                'tax_number',
                'blood_type',
                'religion',
                'marital_status',
                'address',
                'city',
                'province',
                'postal_code',
                'end_date',
                'employment_type',
                'photo_url',
            ]);
        });
    }
};
