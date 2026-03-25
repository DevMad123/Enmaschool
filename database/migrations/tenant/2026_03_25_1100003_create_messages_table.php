<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table): void {
            // Note: reply_to_id FK added separately below (self-referential requires ALTER TABLE in PostgreSQL)
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->enum('type', ['text', 'file', 'image', 'system'])->default('text');
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->unsignedInteger('attachment_size')->nullable();
            $table->uuid('reply_to_id')->nullable();
            $table->boolean('is_edited')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index('conversation_id');
            $table->index('sender_id');
            $table->index('created_at');
        });

        // Self-referential FK must be added after table creation in PostgreSQL
        Schema::table('messages', function (Blueprint $table): void {
            $table->foreign('reply_to_id')->references('id')->on('messages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropForeign(['reply_to_id']);
        });
        Schema::dropIfExists('messages');
    }
};
