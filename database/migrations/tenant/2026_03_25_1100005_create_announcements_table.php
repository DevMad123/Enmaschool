<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('title', 200);
            $table->text('body');
            $table->enum('type', ['general', 'academic', 'event', 'alert', 'reminder']);
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->jsonb('target_roles');
            $table->jsonb('target_class_ids')->nullable();
            $table->string('attachment_path')->nullable();
            $table->timestamp('publish_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('priority');
            $table->index('is_published');
            $table->index('publish_at');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
