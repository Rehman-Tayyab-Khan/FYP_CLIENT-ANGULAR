<?php

use App\Enums\CaseCategory;
use App\Enums\CasePriority;
use App\Enums\CaseStatus;
use App\Enums\CaseType;
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
        Schema::create('patient_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('case_number')->unique();

            $table->foreignUuid('patient_id')
                ->constrained('patients')
                ->onDelete('restrict');

            $table->foreignUuid('practice_location_id')
                ->constrained('practice_locations')
                ->onDelete('restrict');

            $table->enum('category', array_column(CaseCategory::cases(), 'value'));
            $table->text('purpose_of_visit');

            $table->enum('case_type', array_column(CaseType::cases(), 'value'));
            $table->enum('priority', array_column(CasePriority::cases(), 'value'))
                ->default(CasePriority::NORMAL->value);

            $table->enum('case_status', array_column(CaseStatus::cases(), 'value'))
                ->default(CaseStatus::ACTIVE->value);

            $table->date('date_of_accident')->nullable();

            $table->foreignUuid('insurance_id')
                ->nullable()
                ->constrained('insurances')
                ->onDelete('restrict');

            $table->foreignUuid('firm_id')
                ->nullable()
                ->constrained('firms')
                ->onDelete('restrict');

            $table->string('referred_by')->nullable();
            $table->string('referred_doctor_name')->nullable();

            $table->date('opening_date');
            $table->date('closing_date')->nullable();

            $table->text('clinical_notes')->nullable();
            $table->timestamps();

            $table->softDeletes();

            // Indexes (mirrors Express Sequelize model)
            $table->index('patient_id');
            $table->index(['patient_id', 'case_status']);
            $table->index('practice_location_id');
            $table->index('case_status');
            $table->index('priority');
            $table->index('insurance_id');
            $table->index('firm_id');
            $table->index('opening_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_cases');
    }
};
