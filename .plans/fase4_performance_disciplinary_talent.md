# Fase 4: Performance, Disciplinary & Talent Management

## Ringkasan
Membangun 3 modul baru untuk People Development: Performance Management (KPI, review, appraisal), Disciplinary Management (SP1-SP3, investigasi), dan Talent Management (skill matrix, career path, succession planning, 9-box grid).

## Referensi Dokumen
- [features.md](../docs/Features/features.md) — Modul 6 (Performance), 9 (Talent), 11 (Disciplinary)

---

## Fase 4, Step 1: Modul Performance [NEW]

### Step 1.1: Scaffold Module
```
Modules/Performance/
├── app/
│   ├── Http/Controllers/
│   │   ├── KPIController.php
│   │   ├── KPIAssignmentController.php
│   │   ├── PerformancePeriodController.php
│   │   ├── PerformanceReviewController.php
│   │   └── ImprovementPlanController.php
│   ├── Models/
│   │   ├── KPI.php
│   │   ├── KPIAssignment.php
│   │   ├── PerformancePeriod.php
│   │   ├── PerformanceReview.php
│   │   └── ImprovementPlan.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000060_create_kpis_table.php
│   ├── 2026_06_25_000061_create_kpi_assignments_table.php
│   ├── 2026_06_25_000062_create_performance_periods_table.php
│   ├── 2026_06_25_000063_create_performance_reviews_table.php
│   └── 2026_06_25_000064_create_improvement_plans_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 1.2: Key Migrations

#### kpis
```php
Schema::create('kpis', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('code', 20)->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->string('category', 30)->nullable(); // financial, customer, process, learning
    $table->string('unit', 20); // percentage, number, currency, boolean
    $table->string('measurement_type', 20)->default('higher_better'); // higher_better, lower_better, target_exact
    $table->uuid('position_id')->nullable(); // KPI default untuk posisi tertentu
    $table->boolean('is_active')->default(true);
    // ... universal fields
});
```

#### kpi_assignments
```php
Schema::create('kpi_assignments', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('kpi_id');
    $table->uuid('employee_id');
    $table->uuid('performance_period_id');
    $table->decimal('target_value', 15, 2);
    $table->decimal('actual_value', 15, 2)->nullable();
    $table->decimal('weight', 5, 2)->default(0); // bobot dalam persen (total 100%)
    $table->decimal('score', 5, 2)->nullable(); // 0-100
    $table->text('notes')->nullable();
    // ... universal fields
    $table->foreign('kpi_id')->references('id')->on('kpis');
    $table->foreign('employee_id')->references('id')->on('employees');
    $table->foreign('performance_period_id')->references('id')->on('performance_periods');
    $table->unique(['kpi_id', 'employee_id', 'performance_period_id']);
});
```

#### performance_periods
```php
Schema::create('performance_periods', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name'); // "Q1 2026", "Annual 2026"
    $table->string('type', 20); // quarterly, semi_annual, annual
    $table->date('start_date');
    $table->date('end_date');
    $table->string('status', 20)->default('draft'); // draft, active, review, calibration, completed
    // ... universal fields
});
```

#### performance_reviews
```php
Schema::create('performance_reviews', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('performance_period_id');
    $table->uuid('employee_id');
    $table->decimal('kpi_score', 5, 2)->nullable(); // auto-calculated from KPI assignments
    $table->decimal('self_score', 5, 2)->nullable();
    $table->text('self_comment')->nullable();
    $table->decimal('manager_score', 5, 2)->nullable();
    $table->text('manager_comment')->nullable();
    $table->uuid('manager_id')->nullable();
    $table->decimal('hr_score', 5, 2)->nullable();
    $table->text('hr_comment')->nullable();
    $table->uuid('hr_reviewer_id')->nullable();
    $table->decimal('final_score', 5, 2)->nullable();
    $table->string('rating', 20)->nullable(); // exceptional, exceeds, meets, below, unsatisfactory
    $table->string('status', 20)->default('pending'); // pending, self_review, manager_review, hr_review, calibration, completed
    // ... universal fields
    $table->unique(['performance_period_id', 'employee_id']);
});
```

#### improvement_plans (PIP)
```php
Schema::create('improvement_plans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->uuid('performance_review_id')->nullable();
    $table->string('title');
    $table->text('reason');
    $table->jsonb('action_items'); // [{task, deadline, status}]
    $table->date('start_date');
    $table->date('end_date');
    $table->string('status', 20)->default('active'); // active, extended, completed, failed
    $table->uuid('supervisor_id');
    $table->text('outcome_notes')->nullable();
    // ... universal fields
});
```

### Step 1.3: Frontend
- `apps/web/src/app/performance/page.tsx` [NEW] — Landing dashboard
- `apps/web/src/app/performance/kpi/page.tsx` [NEW] — KPI master list + assignment
- `apps/web/src/app/performance/periods/page.tsx` [NEW] — Period management
- `apps/web/src/app/performance/reviews/page.tsx` [NEW] — Review list + detail (self → manager → HR flow)
- `apps/web/src/app/performance/pip/page.tsx` [NEW] — PIP management
- `apps/web/src/features/performance/components/nine-box-grid.tsx` [NEW] — 9-Box Grid visualization
- `apps/web/src/features/performance/components/review-form.tsx` [NEW] — Multi-step review form

---

## Fase 4, Step 2: Modul Disciplinary [NEW]

### Step 2.1: Scaffold Module
```
Modules/Disciplinary/
├── app/
│   ├── Http/Controllers/
│   │   ├── DisciplinaryCaseController.php
│   │   └── InvestigationController.php
│   ├── Models/
│   │   ├── DisciplinaryCase.php
│   │   ├── DisciplinaryAction.php
│   │   └── Investigation.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000070_create_disciplinary_cases_table.php
│   ├── 2026_06_25_000071_create_disciplinary_actions_table.php
│   └── 2026_06_25_000072_create_investigations_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 2.2: Key Migrations

#### disciplinary_cases
```php
Schema::create('disciplinary_cases', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('case_number', 30)->unique();
    $table->string('category', 30); // attendance, conduct, performance, policy_violation, other
    $table->date('incident_date');
    $table->text('description');
    $table->text('evidence')->nullable(); // paths to evidence files
    $table->string('severity', 20); // minor, moderate, major, critical
    $table->string('status', 20)->default('reported'); // reported, under_investigation, hearing, decided, closed, appealed
    $table->uuid('reported_by');
    // ... universal fields
});
```

#### disciplinary_actions
```php
Schema::create('disciplinary_actions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('disciplinary_case_id');
    $table->string('action_type', 20); // verbal_warning, sp1, sp2, sp3, suspension, termination
    $table->date('effective_date');
    $table->date('expiry_date')->nullable(); // SP biasanya berlaku 6 bulan
    $table->text('description');
    $table->uuid('issued_by');
    $table->string('document_path')->nullable(); // surat peringatan PDF
    $table->uuid('acknowledged_by')->nullable();
    $table->timestamp('acknowledged_at')->nullable();
    // ... universal fields
});
```

#### investigations
```php
Schema::create('investigations', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('disciplinary_case_id');
    $table->uuid('investigator_id');
    $table->text('findings')->nullable();
    $table->text('recommendation')->nullable();
    $table->text('committee_notes')->nullable();
    $table->string('status', 20)->default('in_progress'); // in_progress, completed
    $table->timestamp('completed_at')->nullable();
    // ... universal fields
});
```

### Step 2.3: Frontend
- `apps/web/src/app/disciplinary/page.tsx` [NEW] — Landing + case list
- `apps/web/src/app/disciplinary/cases/[id]/page.tsx` [NEW] — Case detail + timeline
- `apps/web/src/features/disciplinary/components/case-form.tsx` [NEW]
- `apps/web/src/features/disciplinary/components/action-form.tsx` [NEW]

---

## Fase 4, Step 3: Modul Talent Management [NEW]

### Step 3.1: Scaffold Module
```
Modules/Talent/
├── app/
│   ├── Http/Controllers/
│   │   ├── SkillController.php
│   │   ├── EmployeeSkillController.php
│   │   ├── CareerPathController.php
│   │   └── SuccessionPlanController.php
│   ├── Models/
│   │   ├── Skill.php
│   │   ├── EmployeeSkill.php
│   │   ├── CompetencyAssessment.php
│   │   ├── CareerPath.php
│   │   └── SuccessionPlan.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000080_create_skills_table.php
│   ├── 2026_06_25_000081_create_employee_skills_table.php
│   ├── 2026_06_25_000082_create_competency_assessments_table.php
│   ├── 2026_06_25_000083_create_career_paths_table.php
│   └── 2026_06_25_000084_create_succession_plans_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 3.2: Key Migrations

#### skills
```php
Schema::create('skills', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('category', 30); // hard_skill, soft_skill, technical, leadership, language
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    // ... universal fields
});
```

#### employee_skills
```php
Schema::create('employee_skills', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->uuid('skill_id');
    $table->integer('proficiency_level'); // 1-5 (Beginner to Expert)
    $table->date('assessed_at')->nullable();
    $table->uuid('assessed_by')->nullable();
    $table->text('notes')->nullable();
    // ... universal fields
    $table->unique(['employee_id', 'skill_id']);
});
```

#### career_paths
```php
Schema::create('career_paths', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('from_position_id');
    $table->uuid('to_position_id');
    $table->string('path_type', 20); // promotion, lateral, specialization
    $table->integer('typical_years')->nullable(); // estimasi tahun untuk mencapai
    $table->jsonb('requirements')->nullable(); // [{type: 'certification', id: '...', name: '...'}, {type: 'skill', ...}]
    $table->text('description')->nullable();
    // ... universal fields
    $table->foreign('from_position_id')->references('id')->on('positions');
    $table->foreign('to_position_id')->references('id')->on('positions');
});
```

#### succession_plans
```php
Schema::create('succession_plans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('position_id'); // posisi kunci yang perlu successor
    $table->uuid('incumbent_employee_id')->nullable(); // pemegang jabatan saat ini
    $table->uuid('candidate_employee_id');
    $table->string('readiness_level', 20); // ready_now, ready_1_year, ready_2_years, development_needed
    $table->decimal('potential_score', 5, 2)->nullable();
    $table->decimal('performance_score', 5, 2)->nullable();
    $table->jsonb('development_actions')->nullable(); // [{action, deadline, status}]
    $table->text('notes')->nullable();
    // ... universal fields
});
```

### Step 3.3: Frontend
- `apps/web/src/app/talent/page.tsx` [NEW] — Landing dashboard
- `apps/web/src/app/talent/skills/page.tsx` [NEW] — Skill master + employee skill matrix (heatmap)
- `apps/web/src/app/talent/career-path/page.tsx` [NEW] — Career path tree visualization
- `apps/web/src/app/talent/succession/page.tsx` [NEW] — Succession planning board
- `apps/web/src/features/talent/components/skill-matrix-heatmap.tsx` [NEW] — Heatmap grid (employees × skills)
- `apps/web/src/features/talent/components/nine-box-grid.tsx` [NEW] — 9-Box talent mapping (Performance × Potential)
- `apps/web/src/features/talent/components/career-tree.tsx` [NEW] — Tree/graph visualization of career paths

---

## Fase 4, Step 4: i18n, Dashboard & Permissions

### Step 4.1: i18n
- Tambah namespaces: `performance`, `disciplinary`, `talent` ke `en.json` dan `id.json`

### Step 4.2: Dashboard & AppLauncher
- Tambah menu items di mega menu dan AppLauncher

### Step 4.3: Permission Seeders
- Performance: `kpi.view/create/update/delete`, `performance_review.view/create/update`, `pip.view/create/update`
- Disciplinary: `disciplinary.view/create/update/delete`, `investigation.view/create/update`
- Talent: `skill.view/create/update/delete`, `career_path.view/create/update`, `succession.view/create/update`

---

## Checklist Verifikasi Fase 4

- [ ] Performance: KPI CRUD + assignment + period + full review cycle (self → manager → HR → calibration)
- [ ] Performance: 9-Box Grid renders correctly
- [ ] Performance: PIP CRUD + tracking
- [ ] Disciplinary: case CRUD + investigation + SP issuance flow
- [ ] Talent: skill matrix heatmap renders
- [ ] Talent: career path tree visualization
- [ ] Talent: succession planning board
- [ ] Unit tests: all green
- [ ] i18n complete
- [ ] `npm run build` — zero errors
