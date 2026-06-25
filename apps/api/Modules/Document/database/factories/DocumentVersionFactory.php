<?php

declare(strict_types=1);

namespace Modules\Document\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Document\Models\Document;
use Modules\Document\Models\DocumentVersion;
use Modules\Employee\Models\Employee;

class DocumentVersionFactory extends Factory
{
    protected $model = DocumentVersion::class;

    public function definition(): array
    {
        return [
            'document_id' => Document::factory(),
            'version_number' => 1,
            'file_path' => 'documents/test_file.pdf',
            'file_size' => 1024,
            'uploaded_by' => Employee::factory(),
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
