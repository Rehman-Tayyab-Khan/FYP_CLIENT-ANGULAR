 <?php

use App\Enums\Gender;
use App\Enums\PatientStatus;
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
        Schema::create('patients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('first_name');

            $table->string('middle_name')->nullable();
            $table->string('last_name');

            $table->date('date_of_birth');
            $table->enum('gender', array_column(Gender::cases(), 'value'))->default(Gender::PREFER_NOT_TO_SAY->value);

            $table->string('cnic')->unique()->nullable();
            $table->string('email')->unique()->nullable();

            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();

            $table->text('address')->nullable();
            $table->string('city')->nullable();

            $table->string('state')->nullable();
            $table->string('zip_code')->nullable();

            $table->string('country')->nullable();
            $table->string('emergency_contact_name')->nullable();

            $table->string('emergency_contact_phone')->nullable();
            $table->string('primary_physician')->nullable();

            $table->string('insurance_provider')->nullable();
            $table->string('insurance_policy_number')->nullable();

            $table->string('preferred_language')->default('English');
            $table->enum('patient_status', array_column(PatientStatus::cases(), 'value'))
                ->default(PatientStatus::ACTIVE->value);

            $table->datetime('registration_date');
            $table->timestamps();

            $table->softDeletes();

            // Unique constraint: no duplicate patient (first + last + DOB)
            $table->unique(['first_name', 'last_name', 'date_of_birth'], 'unique_patient');

            // Indexes (mirrors Express Sequelize model)
            $table->index(['last_name', 'first_name']);
            $table->index('date_of_birth');
            $table->index('patient_status');
            $table->index('phone');
            $table->index('registration_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
