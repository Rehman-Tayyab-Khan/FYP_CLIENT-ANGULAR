<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('location_name')->unique();

            $table->text('address')->nullable();
            $table->string('city');

            $table->string('state');
            $table->string('zip');

            $table->string('phone')->nullable();
            $table->string('email')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Indexes (mirrors Express Sequelize model)
            $table->index('is_active');
            $table->index(['city', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_locations');
    }
};
