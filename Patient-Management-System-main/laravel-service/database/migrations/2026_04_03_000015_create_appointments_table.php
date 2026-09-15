<?php

use App\Enums\AppointmentStatus;
use App\Enums\AppointmentType;
use App\Enums\ReminderMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('appointment_number')->unique();

            $table->foreignUuid('case_id')->constrained('patient_cases')->cascadeOnDelete();
            $table->foreignUuid('patient_id')->constrained()->cascadeOnDelete();

            $table->foreignUuid('doctor_id')
                ->constrained('doctor_profiles')
                ->cascadeOnDelete();

            $table->date('appointment_date');
            $table->time('appointment_time');
            // $table->time('end_time')->nullable(); // computed in app logic

            $table->enum('appointment_type', array_column(AppointmentType::cases(), 'value'))
                ->default(AppointmentType::NEW_PATIENT->value);

            $table->foreignUuid('specialty_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('practice_location_id')->constrained()->cascadeOnDelete();

            $table->integer('duration_minutes')->default(30);

            $table->enum('status', array_column(AppointmentStatus::cases(), 'value'))
                ->default(AppointmentStatus::SCHEDULED->value);

            $table->boolean('reminder_sent')->default(false);

            $table->enum('reminder_method', array_column(ReminderMethod::cases(), 'value'))->nullable();

            $table->text('notes')->nullable();
            $table->text('reason_for_visit');

            // created_by -> users (FDO)
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes (mirrors Express Sequelize model)
            $table->index(['doctor_id', 'appointment_date']);
            $table->index(['patient_id', 'appointment_date']);
            $table->index(['practice_location_id', 'appointment_date']);
            $table->index('case_id');
            $table->index('status');
            $table->index(['appointment_date', 'status']);
            $table->index('created_by');
            $table->index(['reminder_sent', 'appointment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
