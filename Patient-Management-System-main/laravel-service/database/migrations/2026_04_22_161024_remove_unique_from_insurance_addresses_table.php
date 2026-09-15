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
        Schema::table('insurance_addresses', function (Blueprint $table) {
            // Remove the unique constraint that was blocking multiple non-primary addresses
            $table->dropUnique(['insurance_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('insurance_addresses', function (Blueprint $table) {
            $table->unique(['insurance_id', 'is_primary']);
        });
    }
};
