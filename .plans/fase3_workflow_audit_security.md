# Fase 3: Workflow Engine, Audit & Security

## Ringkasan
Membangun Workflow Engine visual (drag-and-drop), Audit Trail system, dan memperkuat Security (session control, device tracking). Workflow Engine menjadi fondasi approval dinamis untuk semua modul.

## Referensi Dokumen
- [features.md](../docs/Features/features.md) — Modul 15 (Workflow), 17 (Compliance & Audit), 18 (Security)

## Kondisi Existing
- Approval hardcoded di Leave (LeaveApproval) dan Recruitment (HiringApproval)
- Belum ada workflow engine, audit trail, atau login history
- RBAC sudah ada (Spatie Permission), tapi belum ada MFA, session control, device tracking

## Target Akhir
- Workflow Engine dengan visual DnD builder untuk definisi approval dinamis
- Audit Trail otomatis (semua perubahan data ter-log)
- Login History tracking
- Session control (auto-logout idle)
- Device tracking (alert perangkat baru)

---

## Fase 3, Step 1: Modul Workflow [NEW]

### Step 1.1: Scaffold Module
```
Modules/Workflow/
├── app/
│   ├── Http/Controllers/
│   │   ├── WorkflowDefinitionController.php
│   │   ├── WorkflowStepController.php
│   │   └── WorkflowInstanceController.php
│   ├── Models/
│   │   ├── WorkflowDefinition.php
│   │   ├── WorkflowStep.php
│   │   ├── WorkflowInstance.php
│   │   └── WorkflowAction.php
│   ├── Services/
│   │   └── WorkflowEngine.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000040_create_workflow_definitions_table.php
│   ├── 2026_06_25_000041_create_workflow_steps_table.php
│   ├── 2026_06_25_000042_create_workflow_instances_table.php
│   └── 2026_06_25_000043_create_workflow_actions_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 1.2: Key Migrations

#### workflow_definitions
```php
Schema::create('workflow_definitions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('module', 50); // leave, recruitment, payroll, claim, lifecycle, etc.
    $table->string('entity_type'); // e.g. "Modules\\Leave\\Models\\LeaveRequest"
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('version')->default(1);
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
});
```

#### workflow_steps
```php
Schema::create('workflow_steps', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('workflow_definition_id');
    $table->integer('step_order');
    $table->string('name');
    $table->string('approver_type', 30); // role, specific_user, reports_to, department_head
    $table->uuid('approver_role_id')->nullable(); // jika type = role
    $table->uuid('approver_user_id')->nullable(); // jika type = specific_user
    $table->text('condition_expression')->nullable(); // JSON: {"field": "amount", "operator": ">", "value": 5000000}
    $table->boolean('is_optional')->default(false);
    $table->integer('sla_hours')->nullable(); // batas waktu approval
    $table->string('on_timeout', 20)->default('escalate'); // escalate, auto_approve, auto_reject
    $table->timestamps();

    $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->cascadeOnDelete();
    $table->unique(['workflow_definition_id', 'step_order']);
});
```

#### workflow_instances
```php
Schema::create('workflow_instances', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('workflow_definition_id');
    $table->string('entity_type');
    $table->uuid('entity_id');
    $table->integer('current_step_order')->default(1);
    $table->string('status', 20)->default('in_progress'); // in_progress, approved, rejected, cancelled
    $table->uuid('initiated_by');
    $table->timestamp('completed_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
    $table->uuid('created_by')->nullable();
    $table->uuid('updated_by')->nullable();
    $table->uuid('deleted_by')->nullable();
    $table->integer('version')->default(1);

    $table->foreign('workflow_definition_id')->references('id')->on('workflow_definitions')->cascadeOnDelete();
});
```

#### workflow_actions
```php
Schema::create('workflow_actions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('workflow_instance_id');
    $table->uuid('workflow_step_id');
    $table->integer('step_order');
    $table->uuid('actor_id');
    $table->string('action', 20); // approve, reject, return, delegate
    $table->text('comment')->nullable();
    $table->timestamp('acted_at');
    $table->timestamps();

    $table->foreign('workflow_instance_id')->references('id')->on('workflow_instances')->cascadeOnDelete();
    $table->foreign('workflow_step_id')->references('id')->on('workflow_steps')->cascadeOnDelete();
});
```

### Step 1.3: WorkflowEngine Service
- **File:** `Modules/Workflow/app/Services/WorkflowEngine.php` [NEW]
- **Methods:**
  - `initiate(WorkflowDefinition $def, Model $entity, User $initiator): WorkflowInstance`
  - `getNextApprover(WorkflowInstance $instance): ?User`
  - `approve(WorkflowInstance $instance, User $actor, ?string $comment): WorkflowInstance`
  - `reject(WorkflowInstance $instance, User $actor, string $reason): WorkflowInstance`
  - `return(WorkflowInstance $instance, User $actor, string $reason): WorkflowInstance`
  - `isComplete(WorkflowInstance $instance): bool`
  - `evaluateCondition(WorkflowStep $step, Model $entity): bool`

### Step 1.4: Controllers
- `WorkflowDefinitionController` — CRUD definitions + steps (nested)
- `WorkflowStepController` — CRUD steps under definition (reorder support)
- `WorkflowInstanceController` — List instances, show detail, approve/reject/return actions

### Step 1.5: Routes
```php
Route::apiResource('workflow-definitions', WorkflowDefinitionController::class);
Route::apiResource('workflow-definitions.steps', WorkflowStepController::class);
Route::post('workflow-definitions.steps/reorder', [WorkflowStepController::class, 'reorder']);
Route::get('workflow-instances', [WorkflowInstanceController::class, 'index']);
Route::get('workflow-instances/{instance}', [WorkflowInstanceController::class, 'show']);
Route::post('workflow-instances/{instance}/approve', [WorkflowInstanceController::class, 'approve']);
Route::post('workflow-instances/{instance}/reject', [WorkflowInstanceController::class, 'reject']);
Route::post('workflow-instances/{instance}/return', [WorkflowInstanceController::class, 'returnToSender']);
```

### Step 1.6: Frontend — Workflow Builder (Visual DnD)
- **File:** `apps/web/src/app/settings/workflows/page.tsx` [NEW] — List workflow definitions
- **File:** `apps/web/src/app/settings/workflows/[id]/page.tsx` [NEW] — Visual DnD builder
- **Detail Builder:**
  - Gunakan `@dnd-kit/core` + `@dnd-kit/sortable`
  - Canvas area: step nodes connected by arrows (linear flow)
  - Each step node: name, approver type (dropdown), condition (modal form)
  - Drag to reorder steps
  - Add/Remove step buttons
  - Preview mode: simulate flow
  - Save: POST/PUT ke API
- **File:** `apps/web/src/features/workflow/components/workflow-builder.tsx` [NEW]
- **File:** `apps/web/src/features/workflow/components/step-node.tsx` [NEW]
- **File:** `apps/web/src/features/workflow/components/condition-modal.tsx` [NEW]

### Step 1.7: Frontend — Pending Approvals Widget
- **File:** `apps/web/src/features/workflow/components/pending-approvals.tsx` [NEW]
- **Detail:** Widget di dashboard showing pending approvals for current user across all modules

---

## Fase 3, Step 2: Modul Audit [NEW]

### Step 2.1: Scaffold Module
```
Modules/Audit/
├── app/
│   ├── Http/Controllers/
│   │   ├── AuditLogController.php
│   │   └── LoginHistoryController.php
│   ├── Models/
│   │   ├── AuditLog.php
│   │   └── LoginHistory.php
│   ├── Observers/
│   │   └── AuditObserver.php
│   └── Providers/
├── database/migrations/
│   ├── 2026_06_25_000050_create_audit_logs_table.php
│   └── 2026_06_25_000051_create_login_histories_table.php
├── routes/api.php
└── tests/Unit/
```

### Step 2.2: Key Migrations

#### audit_logs
```php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->nullable();
    $table->string('user_name')->nullable(); // snapshot
    $table->string('action', 20); // created, updated, deleted, restored, force_deleted
    $table->string('auditable_type'); // model class name
    $table->uuid('auditable_id');
    $table->string('auditable_label')->nullable(); // human-readable label (e.g. employee name)
    $table->jsonb('old_values')->nullable();
    $table->jsonb('new_values')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->text('user_agent')->nullable();
    $table->string('module', 50)->nullable();
    $table->timestamp('created_at');

    $table->index(['auditable_type', 'auditable_id']);
    $table->index('user_id');
    $table->index('created_at');
});
```

#### login_histories
```php
Schema::create('login_histories', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id');
    $table->string('ip_address', 45);
    $table->string('device', 100)->nullable();
    $table->string('browser', 100)->nullable();
    $table->string('os', 50)->nullable();
    $table->string('location')->nullable(); // city/country from IP
    $table->string('status', 20); // success, failed, locked
    $table->timestamp('login_at');
    $table->timestamp('logout_at')->nullable();
    $table->boolean('is_new_device')->default(false);
    $table->timestamps();

    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
    $table->index('user_id');
});
```

### Step 2.3: AuditObserver
- **File:** `Modules/Audit/app/Observers/AuditObserver.php` [NEW]
- **Detail:** Laravel Model Observer yang auto-log created/updated/deleted/restored events
- Register di BaseModel atau via ServiceProvider untuk semua model yang extends BaseModel
- Capture: old values (on update), new values, user_id from auth, IP from request

### Step 2.4: Integrate LoginHistory
- **File:** `app/Http/Controllers/AuthController.php` [MODIFY]
- **Detail:** Pada method `login()`, setelah berhasil auth, create LoginHistory record

### Step 2.5: Frontend
- **File:** `apps/web/src/app/audit-trail/page.tsx` [NEW] — Searchable audit log viewer
- **File:** `apps/web/src/app/audit-trail/login-history/page.tsx` [NEW] — Login history table
- **Detail:** Filter by user, module, action, date range. Pagination. JSON diff viewer for old/new values.

---

## Fase 3, Step 3: Perkuat Security

### Step 3.1: Session Control
- **File:** `apps/web/src/components/AuthGuard.tsx` [MODIFY]
- **Detail:** Add idle timeout detection (configurable, default 30 minutes)
  - Track last activity timestamp
  - Show warning modal 5 minutes before timeout
  - Auto-logout and redirect to `/login`

### Step 3.2: Device Tracking
- **File:** `app/Http/Controllers/AuthController.php` [MODIFY]
- **Detail:** On login, generate device fingerprint (hash of User-Agent + IP range)
  - Compare with existing LoginHistory records
  - If new device → set `is_new_device = true`
  - API response includes `is_new_device` flag → frontend shows alert

### Step 3.3: Compliance Monitoring
- **File:** `Modules/Audit/app/Services/ComplianceService.php` [NEW]
- **Detail:**
  - `getExpiringContracts(int $daysAhead = 30): Collection` — employees with end_date approaching
  - `getExpiringCertifications(int $daysAhead = 30): Collection` — from Certification module
  - Dashboard widget showing compliance alerts

---

## Fase 3, Step 4: i18n & Integration

### Step 4.1: i18n
- Tambah namespaces: `workflow`, `audit`, `security` ke `en.json` dan `id.json`

### Step 4.2: Dashboard & AppLauncher
- Tambah menu items: Workflow Settings, Audit Trail

### Step 4.3: Permission Seeders
- Workflow: `workflow.view`, `workflow.create`, `workflow.update`, `workflow.delete`
- Audit: `audit.view`, `audit.export`
- Login History: `login_history.view`

---

## Checklist Verifikasi Fase 3

- [ ] Workflow: definition + steps CRUD berfungsi
- [ ] Workflow: DnD builder visual berfungsi (reorder, add, remove steps)
- [ ] Workflow: engine approve/reject/return flow end-to-end
- [ ] Audit: semua CRUD operations auto-logged
- [ ] Audit: login history recorded on every login
- [ ] Security: idle timeout auto-logout berfungsi
- [ ] Security: new device alert berfungsi
- [ ] Frontend: audit log viewer searchable + filterable
- [ ] Unit tests: all green
- [ ] `npm run build` — zero errors
