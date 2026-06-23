<?php

declare(strict_types=1);

namespace Modules\Document\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentCategory;
use Modules\Employee\Models\Employee;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'employee_id' => Employee::factory(),
            'document_category_id' => DocumentCategory::factory(),
            'file_name' => $this->faker->uuid() . '.pdf',
            'original_name' => $this->faker->word() . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => $this->faker->numberBetween(1024, 1024 * 1024 * 5),
            'storage_provider' => 's3',
            'storage_path' => 'tenants/test/documents/2026/06/' . $this->faker->uuid() . '.pdf',
            'expiry_date' => $this->faker->optional()->date(),
        ];
    }
}
