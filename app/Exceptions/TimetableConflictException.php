<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

class TimetableConflictException extends Exception
{
    /** @var array<string, mixed> */
    private array $conflicts;

    /**
     * @param array<string, mixed> $conflicts
     */
    public function __construct(array $conflicts, string $message = 'Conflit détecté dans l\'emploi du temps.')
    {
        parent::__construct($message);
        $this->conflicts = $conflicts;
    }

    /**
     * @return array<string, mixed>
     */
    public function getConflicts(): array
    {
        return $this->conflicts;
    }
}
