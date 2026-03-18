<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SchoolLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['code' => 'PS',   'category' => 'maternelle', 'label' => 'Petite Section',       'short_label' => 'PS',   'order' => 1,  'requires_serie' => false],
            ['code' => 'MS',   'category' => 'maternelle', 'label' => 'Moyenne Section',      'short_label' => 'MS',   'order' => 2,  'requires_serie' => false],
            ['code' => 'GS',   'category' => 'maternelle', 'label' => 'Grande Section',       'short_label' => 'GS',   'order' => 3,  'requires_serie' => false],
            ['code' => 'CP1',  'category' => 'primaire',   'label' => 'Cours Préparatoire 1', 'short_label' => 'CP1',  'order' => 4,  'requires_serie' => false],
            ['code' => 'CP2',  'category' => 'primaire',   'label' => 'Cours Préparatoire 2', 'short_label' => 'CP2',  'order' => 5,  'requires_serie' => false],
            ['code' => 'CE1',  'category' => 'primaire',   'label' => 'Cours Élémentaire 1',  'short_label' => 'CE1',  'order' => 6,  'requires_serie' => false],
            ['code' => 'CE2',  'category' => 'primaire',   'label' => 'Cours Élémentaire 2',  'short_label' => 'CE2',  'order' => 7,  'requires_serie' => false],
            ['code' => 'CM1',  'category' => 'primaire',   'label' => 'Cours Moyen 1',        'short_label' => 'CM1',  'order' => 8,  'requires_serie' => false],
            ['code' => 'CM2',  'category' => 'primaire',   'label' => 'Cours Moyen 2',        'short_label' => 'CM2',  'order' => 9,  'requires_serie' => false],
            ['code' => '6EME', 'category' => 'college',    'label' => 'Sixième',              'short_label' => '6ème', 'order' => 10, 'requires_serie' => false],
            ['code' => '5EME', 'category' => 'college',    'label' => 'Cinquième',            'short_label' => '5ème', 'order' => 11, 'requires_serie' => false],
            ['code' => '4EME', 'category' => 'college',    'label' => 'Quatrième',            'short_label' => '4ème', 'order' => 12, 'requires_serie' => false],
            ['code' => '3EME', 'category' => 'college',    'label' => 'Troisième',            'short_label' => '3ème', 'order' => 13, 'requires_serie' => false],
            ['code' => '2NDE', 'category' => 'lycee',      'label' => 'Seconde',              'short_label' => '2nde', 'order' => 14, 'requires_serie' => true],
            ['code' => '1ERE', 'category' => 'lycee',      'label' => 'Première',             'short_label' => '1ère', 'order' => 15, 'requires_serie' => true],
            ['code' => 'TLE',  'category' => 'lycee',      'label' => 'Terminale',            'short_label' => 'Tle',  'order' => 16, 'requires_serie' => true],
        ];

        foreach ($levels as $level) {
            DB::table('school_levels')->updateOrInsert(
                ['code' => $level['code']],
                array_merge($level, [
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
