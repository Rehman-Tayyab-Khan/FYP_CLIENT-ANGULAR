<?php

use App\Enums\FirmType;
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
        Schema::create('firms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('firm_name');

            $table->enum('firm_type', array_column(FirmType::cases(), 'value'))->default(FirmType::OTHER->value);
            $table->text('address');

            $table->string('phone');
            $table->string('contact_person');

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->softDeletes();

            // Indexes (mirrors Express Sequelize model)
            $table->index('firm_name');
            $table->index('firm_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('firms');
    }
};
