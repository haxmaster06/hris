<?php

declare(strict_types=1);

namespace Modules\Certification\Models;

use App\Models\BaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Employee\Models\Employee;

class EmployeeCertification extends BaseModel
{
    use HasFactory;

    protected static function newFactory(): \Modules\Certification\Database\Factories\EmployeeCertificationFactory
    {
        return \Modules\Certification\Database\Factories\EmployeeCertificationFactory::new();
    }

    protected $fillable = [
        'employee_id',
        'certification_id',
        'certificate_number',
        'issue_date',
        'expired_date',
        'document_path',
        'status',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expired_date' => 'date',
    ];

    /**
     * Get the employee holding this certificate.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the master certification reference.
     */
    public function certification(): BelongsTo
    {
        return $this->belongsTo(Certification::class);
    }
}
