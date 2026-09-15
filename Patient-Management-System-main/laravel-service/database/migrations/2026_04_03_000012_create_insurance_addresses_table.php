<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_addresses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('insurance_id')->constrained('insurances')->cascadeOnDelete();

            $table->text('address');
            $table->string('phone')->nullable();

            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->softDeletes();

            // Ensure only one primary address per insurance
            $table->unique(['insurance_id', 'is_primary']);

            // Indexes (mirrors Express Sequelize model)
            $table->index('insurance_id');
            $table->index(['insurance_id', 'is_primary']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_addresses');
    }
};
