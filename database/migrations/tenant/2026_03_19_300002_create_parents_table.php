<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parents', function (Blueprint $table): void {
            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->enum('gender', ['male', 'female']);
            $table->enum('relationship', ['father', 'mother', 'guardian', 'other']);
            $table->string('phone', 20)->nullable();
            $table->string('phone_secondary', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('profession')->nullable();
            $table->text('address')->nullable();
            $table->string('national_id')->nullable(); // CNI ou passeport
            $table->boolean('is_emergency_contact')->default(true);
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX parents_name_idx ON parents (last_name, first_name)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX parents_phone_idx ON parents (phone)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX parents_email_idx ON parents (email)
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('parents');
    }
};
