<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('insurance_name');

            $table->string('insurance_code')->unique();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Indexes (mirrors Express Sequelize model)
            $table->index('insurance_name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurances');
    }
};
