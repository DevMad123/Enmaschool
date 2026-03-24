<?php
use App\Models\Central\Tenant;
use App\Models\Tenant\TimeSlot;

Tenant::all()->each(function ($tenant) {
    $tenant->run(function() {
        // Supprimer les créneaux order=10 ajoutés manuellement (17h-18h)
        $deleted = TimeSlot::where('order', 10)->delete();
        echo "Tenant: supprimé {$deleted} créneau(x) order=10\n";

        $total = TimeSlot::count();
        echo "Total créneaux restants: {$total}\n";
    });
});
