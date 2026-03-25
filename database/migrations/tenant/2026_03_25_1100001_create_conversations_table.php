<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->enum('type', ['direct', 'group']);
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->string('avatar')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->string('last_message_preview', 200)->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index('type');
            $table->index('last_message_at');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
