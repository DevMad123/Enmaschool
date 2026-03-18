<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable()->unique();
            $table->enum('type', ['classroom', 'lab', 'gym', 'library', 'amphitheater', 'other'])->default('classroom');
            $table->unsignedSmallInteger('capacity')->default(40);
            $table->string('floor')->nullable();
            $table->string('building')->nullable();
            $table->jsonb('equipment')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
