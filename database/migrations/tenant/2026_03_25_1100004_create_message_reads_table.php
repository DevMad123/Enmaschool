<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('message_reads', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->uuid('message_id');
            $table->foreign('message_id')->references('id')->on('messages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at');

            $table->unique(['message_id', 'user_id']);
            $table->index('message_id');
            $table->index('user_id');
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reads');
    }
};
