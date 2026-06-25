# Fase 5: Engagement, Asset & Gap Fitur Modul Existing

## Ringkasan
Membangun modul Employee Engagement (survey, feedback, awards) dan Asset Management (registry, assignment), serta menutup gap fitur di modul-modul yang sudah ada (Attendance, Leave, Training, Certification, Document, Recruitment).

## Referensi Dokumen
- [features.md](../docs/Features/features.md) — Modul 10, 13, dan gap dari Modul 2, 3, 4, 7, 8, 14

---

## Fase 5, Step 1: Modul Engagement [NEW]

### Step 1.1: Scaffold Module
```
Modules/Engagement/
├── app/
│   ├── Http/Controllers/
│   │   ├── SurveyController.php
│   │   ├── SurveyResponseController.php
│   │   ├── FeedbackController.php
│   │   └── AwardController.php
│   ├── Models/
│   │   ├── Survey.php
│   │   ├── SurveyQuestion.php
│   │   ├── SurveyResponse.php
│   │   ├── SurveyAnswer.php
│   │   ├── Feedback.php
│   │   └── Award.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000090_create_surveys_table.php
│   ├── 2026_06_25_000091_create_survey_questions_table.php
│   ├── 2026_06_25_000092_create_survey_responses_table.php
│   ├── 2026_06_25_000093_create_survey_answers_table.php
│   ├── 2026_06_25_000094_create_feedbacks_table.php
│   └── 2026_06_25_000095_create_awards_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 1.2: Key Migrations

#### surveys
```php
Schema::create('surveys', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('type', 20); // satisfaction, pulse, engagement, custom
    $table->string('status', 20)->default('draft'); // draft, published, closed, archived
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();
    $table->boolean('is_anonymous')->default(false);
    $table->string('target_audience', 20)->default('all'); // all, department, position, custom
    $table->jsonb('target_ids')->nullable(); // department_ids or position_ids
    // ... universal fields
});
```

#### survey_questions
```php
Schema::create('survey_questions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('survey_id');
    $table->text('question');
    $table->string('type', 20); // scale_1_5, scale_1_10, text, single_choice, multiple_choice
    $table->jsonb('options')->nullable(); // ["Sangat Baik", "Baik", "Cukup", "Kurang"]
    $table->boolean('is_required')->default(true);
    $table->integer('sort_order')->default(0);
    // ... universal fields
    $table->foreign('survey_id')->references('id')->on('surveys')->cascadeOnDelete();
});
```

#### feedbacks
```php
Schema::create('feedbacks', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id')->nullable(); // null jika anonymous
    $table->string('type', 20); // suggestion, complaint, appreciation, other
    $table->string('category', 30)->nullable(); // work_environment, management, policy, compensation, other
    $table->text('content');
    $table->boolean('is_anonymous')->default(false);
    $table->string('status', 20)->default('submitted'); // submitted, reviewed, in_progress, resolved, closed
    $table->text('response')->nullable();
    $table->uuid('responded_by')->nullable();
    $table->timestamp('responded_at')->nullable();
    // ... universal fields
});
```

#### awards
```php
Schema::create('awards', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('employee_id');
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('category', 30); // employee_of_month, innovation, teamwork, leadership, service_excellence
    $table->date('awarded_date');
    $table->uuid('awarded_by');
    $table->string('certificate_path')->nullable();
    // ... universal fields
});
```

### Step 1.3: Frontend
- `apps/web/src/app/engagement/page.tsx` [NEW] — Landing: active surveys, recent feedback, awards wall
- `apps/web/src/app/engagement/surveys/page.tsx` [NEW] — Survey builder + list
- `apps/web/src/app/engagement/surveys/[id]/page.tsx` [NEW] — Survey detail + responses analytics
- `apps/web/src/app/engagement/surveys/[id]/respond/page.tsx` [NEW] — Survey response form (employee)
- `apps/web/src/app/engagement/feedback/page.tsx` [NEW] — Suggestion box + list
- `apps/web/src/app/engagement/awards/page.tsx` [NEW] — Awards wall + CRUD
- `apps/web/src/features/engagement/components/survey-builder.tsx` [NEW]
- `apps/web/src/features/engagement/components/survey-analytics.tsx` [NEW] — Charts (bar, pie, radar)

---

## Fase 5, Step 2: Modul Asset Management [NEW]

### Step 2.1: Scaffold Module
```
Modules/Asset/
├── app/
│   ├── Http/Controllers/
│   │   ├── AssetController.php
│   │   └── AssetAssignmentController.php
│   ├── Models/
│   │   ├── Asset.php
│   │   └── AssetAssignment.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000100_create_assets_table.php
│   └── 2026_06_25_000101_create_asset_assignments_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 2.2: Key Migrations

#### assets
```php
Schema::create('assets', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('asset_number', 30)->unique();
    $table->string('name');
    $table->string('category', 30); // laptop, desktop, monitor, phone, tablet, sim_card, vehicle, furniture, other
    $table->string('brand', 100)->nullable();
    $table->string('model', 100)->nullable();
    $table->string('serial_number', 100)->nullable();
    $table->string('specifications')->nullable();
    $table->date('purchase_date')->nullable();
    $table->decimal('purchase_price', 15, 2)->nullable();
    $table->string('vendor', 100)->nullable();
    $table->string('condition', 20)->default('good'); // new, good, fair, poor, damaged
    $table->string('status', 20)->default('available'); // available, assigned, maintenance, disposed, lost
    $table->string('location')->nullable();
    $table->date('warranty_expiry')->nullable();
    $table->text('notes')->nullable();
    // ... universal fields
});
```

#### asset_assignments
```php
Schema::create('asset_assignments', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('asset_id');
    $table->uuid('employee_id');
    $table->date('assigned_date');
    $table->date('expected_return_date')->nullable();
    $table->date('returned_date')->nullable();
    $table->string('condition_on_assign', 20)->default('good');
    $table->string('condition_on_return', 20)->nullable();
    $table->text('assign_notes')->nullable();
    $table->text('return_notes')->nullable();
    $table->string('bast_document_path')->nullable(); // Berita Acara Serah Terima
    $table->uuid('assigned_by');
    $table->uuid('received_by')->nullable();
    $table->string('status', 20)->default('active'); // active, returned, lost
    // ... universal fields
    $table->foreign('asset_id')->references('id')->on('assets');
    $table->foreign('employee_id')->references('id')->on('employees');
});
```

### Step 2.3: Frontend
- `apps/web/src/app/assets/page.tsx` [NEW] — Landing: asset summary stats, categories
- `apps/web/src/app/assets/registry/page.tsx` [NEW] — Asset registry table + CRUD
- `apps/web/src/app/assets/assignments/page.tsx` [NEW] — Assignment list, assign/return flow
- `apps/web/src/features/assets/components/assign-modal.tsx` [NEW]
- `apps/web/src/features/assets/components/return-modal.tsx` [NEW]

---

## Fase 5, Step 3: Gap Fitur Modul Existing

### 3.1: Attendance Module Gaps
- **Migration:** `2026_06_25_000110_create_attendance_corrections_table.php` [NEW]
  - Fields: employee_id, original_check_in, original_check_out, corrected_check_in, corrected_check_out, reason, status (pending/approved/rejected), approved_by
- **Migration:** `2026_06_25_000111_create_overtime_requests_table.php` [NEW]
  - Fields: employee_id, date, planned_hours, actual_hours, reason, status (pending/approved/rejected), approved_by
- **Migration:** `2026_06_25_000112_add_gps_fields_to_attendance_logs.php` [NEW]
  - Add: latitude, longitude, accuracy, check_in_address, check_out_address
- **Model:** `AttendanceCorrection.php`, `OvertimeRequest.php` [NEW]
- **Controller:** `AttendanceCorrectionController.php`, `OvertimeRequestController.php` [NEW]
- **Frontend:** Tambah tab Corrections dan Overtime di `/attendance-leave`

### 3.2: Leave Module Gaps
- **Migration:** `2026_06_25_000113_create_holidays_table.php` [NEW]
  - Fields: name, date, type (public/company), is_recurring, description
- **Model:** `Holiday.php` [NEW]
- **Controller:** `HolidayController.php` [NEW]
- **Logic:** Tambah carry-forward logic di LeaveBalance (method `carryForward(int $year)`)
- **Frontend:** Tambah tab Holidays + Team Leave Calendar view di `/attendance-leave`

### 3.3: Training Module Gaps
- **Migration:** `2026_06_25_000114_add_fields_to_trainings.php` [NEW]
  - Add: type (internal/external), budget, actual_cost, vendor, pre_test_score, post_test_score, effectiveness_rating
- **Migration:** `2026_06_25_000115_add_fields_to_training_participants.php` [NEW]
  - Add: attendance_status (present/absent/late), pre_score, post_score, certificate_issued
- **Frontend:** Update training pages untuk menampilkan field baru

### 3.4: Certification Module Gaps
- **Logic:** Tambah scheduled command `certification:check-expiry` yang menandai sertifikat mendekati expired
- **Frontend:** Tambah badge/alert "Expiring Soon" di certification list

### 3.5: Document Module Gaps
- **Migration:** `2026_06_25_000116_create_document_versions_table.php` [NEW]
  - Fields: document_id, version_number, file_path, file_size, uploaded_by, notes
- **Migration:** `2026_06_25_000117_add_fields_to_documents.php` [NEW]
  - Add: document_type (identity/employment/education/certification/other), expiry_date
- **Model:** `DocumentVersion.php` [NEW]
- **Frontend:** Show version history, expiry badge

### 3.6: Recruitment Module Gaps
- **Migration:** `2026_06_25_000118_add_fields_to_vacancies.php` [NEW]
  - Add: vacancy_type (internal/external), salary_range_min, salary_range_max
- **Migration:** `2026_06_25_000119_add_fields_to_candidates.php` [NEW]
  - Add: resume_path, talent_pool_status (none/pooled), pool_notes
- **Migration:** `2026_06_25_000120_create_interview_evaluations_table.php` [NEW]
  - Fields: interview_id, evaluator_id, criteria (JSON), overall_score, recommendation (hire/reject/hold), comments
- **Model:** `InterviewEvaluation.php` [NEW]
- **Frontend:** Resume upload pada candidate form, evaluation form modal pada interviews

---

## Fase 5, Step 4: i18n, Dashboard & Permissions

### i18n
- Tambah namespaces: `engagement`, `assets` ke `en.json` dan `id.json`
- Update existing namespaces: `attendance` (corrections, overtime), `leave` (holidays, calendar), `training` (scores, budget), etc.

### Dashboard & AppLauncher
- Tambah menu: Engagement, Asset Management

### Permission Seeders
- Engagement: `survey.view/create/update/delete/respond`, `feedback.view/create/respond`, `award.view/create/delete`
- Asset: `asset.view/create/update/delete`, `asset_assignment.view/create/return`
- Attendance gaps: `attendance_correction.view/create/approve`, `overtime.view/create/approve`
- Leave gaps: `holiday.view/create/update/delete`

---

## Checklist Verifikasi Fase 5

- [ ] Engagement: survey builder → publish → respond → analytics
- [ ] Engagement: suggestion box CRUD + response
- [ ] Engagement: awards wall display
- [ ] Asset: registry CRUD
- [ ] Asset: assign + return flow with BAST
- [ ] Attendance: correction request → approval flow
- [ ] Attendance: overtime request → approval flow
- [ ] Attendance: GPS fields stored on check-in
- [ ] Leave: holiday CRUD + team calendar view
- [ ] Training: type, budget, pre/post test scores
- [ ] Certification: expiry alerts
- [ ] Document: versioning + expiry
- [ ] Recruitment: resume upload, interview evaluation
- [ ] Unit tests: all green
- [ ] i18n complete
- [ ] `npm run build` — zero errors
