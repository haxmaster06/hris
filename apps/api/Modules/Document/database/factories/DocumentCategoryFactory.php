<?php

declare(strict_types=1);

namespace Modules\Document\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Document\Models\DocumentCategory;

class DocumentCategoryFactory extends Factory
{
    protected $model = DocumentCategory::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->word();
        return [
            'id' => $this->faker->uuid(),
            'name' => ucfirst($name),
            'code' => strtoupper($name),
        ];
    }
}
