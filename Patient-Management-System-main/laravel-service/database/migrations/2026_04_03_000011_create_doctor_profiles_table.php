<?php

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
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->onDelete('cascade');

            $table->foreignUuid('specialty_id')->constrained()->onDelete('restrict');
            $table->foreignUuid('practice_location_id')->constrained('practice_locations')->onDelete('restrict');

            $table->string('license_number')->unique();
            $table->json('availability_schedule')->nullable();

            $table->text('bio')->nullable();
            $table->timestamps();

            $table->softDeletes();

            // Indexes (mirrors Express Sequelize model)
            $table->index('specialty_id');
            $table->index('practice_location_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};
