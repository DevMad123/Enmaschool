<?php

declare(strict_types=1);

namespace App\Enums;

enum RoomType: string
{
    case Classroom = 'classroom';
    case Lab = 'lab';
    case Gym = 'gym';
    case Library = 'library';
    case Amphitheater = 'amphitheater';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Classroom => 'Salle de classe',
            self::Lab => 'Laboratoire',
            self::Gym => 'Gymnase',
            self::Library => 'Bibliothèque',
            self::Amphitheater => 'Amphithéâtre',
            self::Other => 'Autre',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Classroom => 'school',
            self::Lab => 'flask-conical',
            self::Gym => 'dumbbell',
            self::Library => 'library',
            self::Amphitheater => 'presentation',
            self::Other => 'building',
        };
    }
}
