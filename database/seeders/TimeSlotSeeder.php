<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TimeSlotSeeder extends Seeder
{
    /**
     * Schéma type (Lundi à Vendredi):
     * 07h30-08h30 → '1er cours'
     * 08h30-09h30 → '2ème cours'
     * 09h30-10h30 → '3ème cours'
     * 10h30-11h00 → 'Récréation' (is_break=true)
     * 11h00-12h00 → '4ème cours'
     * 12h00-13h00 → '5ème cours'
     * 13h00-15h00 → 'Pause déj.' (is_break=true)
     * 15h00-16h00 → '6ème cours'
     * 16h00-17h00 → '7ème cours'
     *
     * 9 créneaux × 5 jours = 45 time_slots
     */
    public function run(): void
    {
        $slots = [
            ['name' => '1er cours',   'start' => '07:30', 'end' => '08:30', 'duration' => 60,  'is_break' => false, 'order' => 1],
            ['name' => '2ème cours',  'start' => '08:30', 'end' => '09:30', 'duration' => 60,  'is_break' => false, 'order' => 2],
            ['name' => '3ème cours',  'start' => '09:30', 'end' => '10:30', 'duration' => 60,  'is_break' => false, 'order' => 3],
            ['name' => 'Récréation', 'start' => '10:30', 'end' => '11:00', 'duration' => 30,  'is_break' => true,  'order' => 4],
            ['name' => '4ème cours',  'start' => '11:00', 'end' => '12:00', 'duration' => 60,  'is_break' => false, 'order' => 5],
            ['name' => '5ème cours',  'start' => '12:00', 'end' => '13:00', 'duration' => 60,  'is_break' => false, 'order' => 6],
            ['name' => 'Pause déj.', 'start' => '13:00', 'end' => '15:00', 'duration' => 120, 'is_break' => true,  'order' => 7],
            ['name' => '6ème cours',  'start' => '15:00', 'end' => '16:00', 'duration' => 60,  'is_break' => false, 'order' => 8],
            ['name' => '7ème cours',  'start' => '16:00', 'end' => '17:00', 'duration' => 60,  'is_break' => false, 'order' => 9],
        ];

        // 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi
        $days = [1, 2, 3, 4, 5, 6];

        foreach ($days as $day) {
            foreach ($slots as $slot) {
                DB::table('time_slots')->updateOrInsert(
                    [
                        'day_of_week' => $day,
                        'start_time'  => $slot['start'],
                    ],
                    [
                        'name'             => $slot['name'],
                        'end_time'         => $slot['end'],
                        'duration_minutes' => $slot['duration'],
                        'is_break'         => $slot['is_break'],
                        'order'            => $slot['order'],
                        'is_active'        => true,
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ]
                );
            }
        }
    }
}
