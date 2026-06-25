<?php

declare(strict_types=1);

namespace Modules\Asset\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Asset\Models\Asset;

class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        return [
            'asset_number' => 'AST-' . $this->faker->unique()->bothify('####-####'),
            'name' => $this->faker->randomElement(['MacBook Pro 14"', 'Lenovo ThinkPad X1', 'Dell UltraSharp 27"', 'iPhone 15 Pro']),
            'category' => $this->faker->randomElement(['laptop', 'desktop', 'monitor', 'phone', 'tablet', 'sim_card', 'vehicle', 'furniture', 'other']),
            'brand' => $this->faker->randomElement(['Apple', 'Lenovo', 'Dell', 'Samsung']),
            'model' => $this->faker->bothify('Model-??##'),
            'serial_number' => $this->faker->uuid(),
            'specifications' => $this->faker->sentence(),
            'purchase_date' => now()->subMonths(6)->toDateString(),
            'purchase_price' => $this->faker->randomFloat(2, 500, 3000),
            'vendor' => $this->faker->company(),
            'condition' => 'good',
            'status' => 'available',
            'location' => $this->faker->city(),
            'warranty_expiry' => now()->addYear()->toDateString(),
            'notes' => $this->faker->sentence(),
            'version' => 1,
        ];
    }
}
