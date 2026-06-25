<?php

declare(strict_types=1);

namespace Modules\Engagement\Tests\Unit;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Str;
use Tests\TestCase;
use Modules\Employee\Models\Employee;
use Modules\Engagement\Models\Survey;
use Modules\Engagement\Models\SurveyQuestion;
use Modules\Engagement\Models\SurveyResponse;
use Modules\Engagement\Models\SurveyAnswer;
use Modules\Engagement\Models\Feedback;
use Modules\Engagement\Models\Award;

class EngagementTest extends TestCase
{
    use DatabaseMigrations;

    private Tenant $tenant;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = (string) Str::uuid();

        $this->tenant = Tenant::create([
            'id' => $this->tenantId,
            'name' => 'Engagement Test Tenant',
            'slug' => 'engagementtest',
        ]);

        tenancy()->initialize($this->tenant);
    }

    /**
     * Test survey and question creation.
     */
    public function test_survey_and_questions_creation(): void
    {
        $survey = Survey::factory()->create([
            'title' => 'Employee Satisfaction 2026',
            'type' => 'satisfaction',
        ]);

        $question1 = SurveyQuestion::factory()->create([
            'survey_id' => $survey->id,
            'question' => 'How happy are you at work?',
            'type' => 'scale_1_5',
        ]);

        $question2 = SurveyQuestion::factory()->create([
            'survey_id' => $survey->id,
            'question' => 'What can we improve?',
            'type' => 'text',
        ]);

        $this->assertNotNull($survey);
        $this->assertCount(2, $survey->questions);
        $this->assertEquals('Employee Satisfaction 2026', $survey->title);
        $this->assertEquals('scale_1_5', $question1->type);
    }

    /**
     * Test survey response and answers creation.
     */
    public function test_survey_response_and_answers(): void
    {
        $survey = Survey::factory()->create();
        $question = SurveyQuestion::factory()->create(['survey_id' => $survey->id]);
        $employee = Employee::factory()->create();

        $response = SurveyResponse::factory()->create([
            'survey_id' => $survey->id,
            'employee_id' => $employee->id,
        ]);

        $answer = SurveyAnswer::factory()->create([
            'survey_response_id' => $response->id,
            'survey_question_id' => $question->id,
            'answer_text' => 'Strongly Agree',
        ]);

        $this->assertCount(1, $response->answers);
        $this->assertEquals($employee->id, $response->employee_id);
        $this->assertEquals('Strongly Agree', $answer->answer_text);
    }

    /**
     * Test suggestion box feedback and response.
     */
    public function test_feedback_suggestion_box(): void
    {
        $employee = Employee::factory()->create();
        $hr = Employee::factory()->create();

        $feedback = Feedback::factory()->create([
            'employee_id' => $employee->id,
            'type' => 'suggestion',
            'category' => 'work_environment',
            'content' => 'Please add more coffee options.',
            'is_anonymous' => false,
            'status' => 'submitted',
        ]);

        $this->assertEquals('submitted', $feedback->status);
        $this->assertFalse($feedback->is_anonymous);

        // HR responds
        $feedback->update([
            'response' => 'We will install a new espresso machine next week.',
            'status' => 'resolved',
            'responded_by' => $hr->id,
            'responded_at' => now(),
        ]);

        $this->assertEquals('resolved', $feedback->fresh()->status);
        $this->assertEquals($hr->id, $feedback->fresh()->responded_by);
    }

    /**
     * Test awards wall details.
     */
    public function test_awards_wall_creation(): void
    {
        $employee = Employee::factory()->create();
        $manager = Employee::factory()->create();

        $award = Award::factory()->create([
            'employee_id' => $employee->id,
            'title' => 'Top Innovator Q2',
            'category' => 'innovation',
            'awarded_by' => $manager->id,
        ]);

        $this->assertNotNull($award);
        $this->assertEquals($employee->id, $award->employee_id);
        $this->assertEquals($manager->id, $award->awarded_by);
    }
}
