<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SchoolSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ── General ──────────────────────────────────────────────────────
            ['key' => 'school_name',         'type' => 'string',  'group' => 'general', 'value' => 'Mon École',         'label' => "Nom de l'école",             'description' => null],
            ['key' => 'school_short_name',   'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Nom abrégé (sigle)',         'description' => null],
            ['key' => 'school_address',      'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Adresse',                    'description' => null],
            ['key' => 'school_city',         'type' => 'string',  'group' => 'general', 'value' => 'Abidjan',           'label' => 'Ville',                      'description' => null],
            ['key' => 'school_phone',        'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Téléphone principal',        'description' => null],
            ['key' => 'school_phone_2',      'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Téléphone secondaire',       'description' => null],
            ['key' => 'school_email',        'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Email de contact',           'description' => null],
            ['key' => 'school_website',      'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Site web',                   'description' => null],
            ['key' => 'school_director_name','type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Nom du directeur/directrice','description' => null],
            ['key' => 'school_motto',        'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => "Devise de l'école",          'description' => null],
            ['key' => 'school_founded_year', 'type' => 'integer', 'group' => 'general', 'value' => '2000',              'label' => 'Année de fondation',         'description' => null],
            ['key' => 'school_logo_path',    'type' => 'string',  'group' => 'general', 'value' => '',                  'label' => 'Chemin du logo',             'description' => null],
            ['key' => 'country',             'type' => 'string',  'group' => 'general', 'value' => 'CI',                'label' => 'Pays',                       'description' => null],
            ['key' => 'timezone',            'type' => 'string',  'group' => 'general', 'value' => 'Africa/Abidjan',    'label' => 'Fuseau horaire',             'description' => null],
            ['key' => 'language',            'type' => 'string',  'group' => 'general', 'value' => 'fr',                'label' => 'Langue',                     'description' => null],
            ['key' => 'currency',            'type' => 'string',  'group' => 'general', 'value' => 'XOF',               'label' => 'Devise',                     'description' => null],

            // ── Academic ─────────────────────────────────────────────────────
            ['key' => 'school_start_time',      'type' => 'string',  'group' => 'academic', 'value' => '07:30',           'label' => 'Heure de début des cours',       'description' => null],
            ['key' => 'school_end_time',        'type' => 'string',  'group' => 'academic', 'value' => '17:00',           'label' => 'Heure de fin des cours',         'description' => null],
            ['key' => 'class_duration_minutes', 'type' => 'integer', 'group' => 'academic', 'value' => '60',              'label' => "Durée d'un cours (minutes)",     'description' => null],
            ['key' => 'break_duration_minutes', 'type' => 'integer', 'group' => 'academic', 'value' => '30',              'label' => 'Durée de la récréation (min)',   'description' => null],
            ['key' => 'lunch_break_start',      'type' => 'string',  'group' => 'academic', 'value' => '13:00',           'label' => 'Début de la pause déjeuner',     'description' => null],
            ['key' => 'lunch_break_end',        'type' => 'string',  'group' => 'academic', 'value' => '15:00',           'label' => 'Fin de la pause déjeuner',       'description' => null],
            ['key' => 'school_days',            'type' => 'json',    'group' => 'academic', 'value' => '[1,2,3,4,5]',     'label' => 'Jours scolaires',                'description' => '1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi'],
            ['key' => 'max_students_per_class', 'type' => 'integer', 'group' => 'academic', 'value' => '40',              'label' => 'Effectif maximum par classe',    'description' => null],
            ['key' => 'academic_year_format',   'type' => 'string',  'group' => 'academic', 'value' => '{start}-{end}',   'label' => "Format nom année scolaire",      'description' => null],

            // ── Grading ──────────────────────────────────────────────────────
            ['key' => 'grading_scale',          'type' => 'integer', 'group' => 'grading', 'value' => '20',     'label' => 'Barème de notation (sur X)',             'description' => null],
            ['key' => 'passing_average',        'type' => 'float',   'group' => 'grading', 'value' => '10.0',   'label' => 'Moyenne de passage',                    'description' => null],
            ['key' => 'grade_rounding',         'type' => 'string',  'group' => 'grading', 'value' => 'half_up','label' => 'Arrondi des notes',                     'description' => 'half_up / floor / ceil'],
            ['key' => 'grade_decimal_places',   'type' => 'integer', 'group' => 'grading', 'value' => '2',      'label' => 'Décimales affichées',                   'description' => null],
            ['key' => 'show_rank_in_report',    'type' => 'boolean', 'group' => 'grading', 'value' => 'true',   'label' => 'Afficher le rang dans le bulletin',     'description' => null],
            ['key' => 'show_class_average',     'type' => 'boolean', 'group' => 'grading', 'value' => 'true',   'label' => 'Afficher la moyenne de classe',          'description' => null],
            ['key' => 'show_min_max_in_report', 'type' => 'boolean', 'group' => 'grading', 'value' => 'true',   'label' => 'Afficher min/max dans le bulletin',     'description' => null],
            ['key' => 'absence_counts_as_zero', 'type' => 'boolean', 'group' => 'grading', 'value' => 'false',  'label' => 'Absence compte comme zéro',             'description' => "Si désactivé, l'absence est ignorée dans le calcul"],
            ['key' => 'allow_grade_override',   'type' => 'boolean', 'group' => 'grading', 'value' => 'false',  'label' => 'Modifier les notes verrouillées',       'description' => 'Réservé aux school_admin uniquement'],
            ['key' => 'grade_mentions',         'type' => 'json',    'group' => 'grading', 'value' => '{"16":"Très Bien","14":"Bien","12":"Assez Bien","10":"Passable","0":"Insuffisant"}', 'label' => 'Mentions par seuil', 'description' => null],

            // ── Attendance ───────────────────────────────────────────────────
            ['key' => 'attendance_risk_threshold',    'type' => 'float',   'group' => 'attendance', 'value' => '80.0', 'label' => "Seuil d'alerte de présence (%)",         'description' => "En dessous de ce seuil, l'élève est considéré à risque"],
            ['key' => 'late_threshold_minutes',       'type' => 'integer', 'group' => 'attendance', 'value' => '15',   'label' => 'Délai avant "en retard" (min)',           'description' => 'Un élève arrivé après X minutes est marqué En retard'],
            ['key' => 'justify_absence_deadline_days','type' => 'integer', 'group' => 'attendance', 'value' => '3',    'label' => 'Délai pour justifier (jours)',            'description' => 'Une absence peut être justifiée jusqu\'à X jours après'],
            ['key' => 'auto_mark_absent',             'type' => 'boolean', 'group' => 'attendance', 'value' => 'false','label' => "Marquer absent si appel non fait",        'description' => null],
            ['key' => 'count_late_as_absent',         'type' => 'boolean', 'group' => 'attendance', 'value' => 'false','label' => 'Retards comptabilisés comme absences',    'description' => null],
            ['key' => 'max_unjustified_absences',     'type' => 'integer', 'group' => 'attendance', 'value' => '10',   'label' => 'Max absences non justifiées avant alerte','description' => null],
            ['key' => 'notify_absence_immediately',   'type' => 'boolean', 'group' => 'attendance', 'value' => 'true', 'label' => "Notifier l'admin à chaque absence",      'description' => null],

            // ── Fees ─────────────────────────────────────────────────────────
            ['key' => 'payment_reminder_days',          'type' => 'integer', 'group' => 'fees', 'value' => '7',    'label' => 'Rappel avant échéance (jours)',           'description' => null],
            ['key' => 'overdue_notification_days',      'type' => 'integer', 'group' => 'fees', 'value' => '3',    'label' => 'Notif après dépassement échéance (jours)','description' => null],
            ['key' => 'allow_partial_payment',          'type' => 'boolean', 'group' => 'fees', 'value' => 'true', 'label' => 'Autoriser les paiements partiels',        'description' => null],
            ['key' => 'max_installments',               'type' => 'integer', 'group' => 'fees', 'value' => '3',    'label' => 'Nombre max de tranches',                  'description' => null],
            ['key' => 'generate_receipt_automatically', 'type' => 'boolean', 'group' => 'fees', 'value' => 'true', 'label' => 'Générer le reçu PDF automatiquement',    'description' => null],
            ['key' => 'receipt_footer_text',            'type' => 'string',  'group' => 'fees', 'value' => 'Ce reçu est un document officiel.', 'label' => 'Pied de page des reçus', 'description' => null],

            // ── Notifications ─────────────────────────────────────────────────
            ['key' => 'notify_bulletin_published',       'type' => 'boolean', 'group' => 'notifications', 'value' => 'true',         'label' => "Bulletin publié",                  'description' => "Notifier les enseignants à la publication d'un bulletin"],
            ['key' => 'notify_absence_recorded',         'type' => 'boolean', 'group' => 'notifications', 'value' => 'true',         'label' => 'Absence signalée',                 'description' => "Notifier l'administration quand une absence est enregistrée"],
            ['key' => 'notify_justification_submitted',  'type' => 'boolean', 'group' => 'notifications', 'value' => 'true',         'label' => 'Justification soumise',            'description' => 'Notifier quand une justification est soumise'],
            ['key' => 'notify_payment_overdue',          'type' => 'boolean', 'group' => 'notifications', 'value' => 'true',         'label' => 'Paiement en retard',               'description' => 'Notifier la comptabilité pour les frais en retard'],
            ['key' => 'notify_timetable_change',         'type' => 'boolean', 'group' => 'notifications', 'value' => 'true',         'label' => "Changement d'emploi du temps",     'description' => 'Notifier les enseignants affectés en cas de modification'],
            ['key' => 'email_notifications_enabled',     'type' => 'boolean', 'group' => 'notifications', 'value' => 'false',        'label' => 'Activer les notifications par email','description' => null],
            ['key' => 'email_sender_name',               'type' => 'string',  'group' => 'notifications', 'value' => 'Enma School',  'label' => "Nom d'expéditeur des emails",       'description' => null],
            ['key' => 'email_sender_address',            'type' => 'string',  'group' => 'notifications', 'value' => '',             'label' => "Adresse email d'expéditeur",        'description' => null],
            ['key' => 'admin_notification_email',        'type' => 'string',  'group' => 'notifications', 'value' => '',             'label' => 'Email administrateur (alertes)',    'description' => null],
        ];

        foreach ($settings as $setting) {
            DB::table('school_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]),
            );
        }
    }
}
