<?php
// ===== database/migrations/2026_03_13_150007_create_ticket_replies_table.php =====

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_replies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')
                ->constrained('support_tickets')
                ->cascadeOnDelete();
            $table->string('author_type');
            $table->unsignedBigInteger('author_id');
            $table->string('author_name');
            $table->text('message');
            $table->jsonb('attachments')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_replies');
    }
};
