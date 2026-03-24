<?php
use App\Models\Central\Tenant;
use App\Models\Tenant\TimeSlot;

Tenant::first()->run(function() {
    foreach ([1=>'Lundi', 2=>'Mardi', 3=>'Mercredi', 4=>'Jeudi', 5=>'Vendredi', 6=>'Samedi'] as $day => $label) {
        $slots = TimeSlot::where('day_of_week', $day)->orderBy('order')->get(['id','name','start_time','end_time','order','is_break']);
        echo "\n{$label} ({$slots->count()} créneaux):\n";
        foreach ($slots as $s) {
            echo "  id={$s->id} order={$s->order} {$s->start_time}-{$s->end_time} {$s->name} break=".($s->is_break?'Y':'N')."\n";
        }
    }
});
