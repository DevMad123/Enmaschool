<?php
// ===== database/seeders/SystemSettingsSeeder.php =====

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // --- general ---
            [
                'key'         => 'app_name',
                'value'       => 'Enma School',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Nom de l\'application',
                'description' => 'Nom affiché dans l\'interface et les e-mails.',
                'is_public'   => true,
            ],
            [
                'key'         => 'app_logo',
                'value'       => null,
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Logo de l\'application',
                'description' => 'Chemin ou URL du logo principal.',
                'is_public'   => true,
            ],
            [
                'key'         => 'app_email',
                'value'       => 'contact@enmaschool.com',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'E-mail de contact',
                'description' => 'Adresse e-mail de contact affichée publiquement.',
                'is_public'   => true,
            ],
            [
                'key'         => 'app_language',
                'value'       => 'fr',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Langue par défaut',
                'description' => 'Code ISO 639-1 de la langue par défaut (ex : fr, en).',
                'is_public'   => true,
            ],
            [
                'key'         => 'app_timezone',
                'value'       => 'Africa/Abidjan',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Fuseau horaire',
                'description' => 'Fuseau horaire principal de la plateforme.',
                'is_public'   => false,
            ],
            [
                'key'         => 'app_currency',
                'value'       => 'XOF',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Devise',
                'description' => 'Code ISO 4217 de la devise utilisée (ex : XOF, EUR).',
                'is_public'   => true,
            ],
            [
                'key'         => 'app_country',
                'value'       => 'CI',
                'type'        => 'string',
                'group'       => 'general',
                'label'       => 'Pays',
                'description' => 'Code ISO 3166-1 alpha-2 du pays principal (ex : CI, FR).',
                'is_public'   => true,
            ],

            // --- email ---
            [
                'key'         => 'smtp_host',
                'value'       => null,
                'type'        => 'string',
                'group'       => 'email',
                'label'       => 'Hôte SMTP',
                'description' => 'Adresse du serveur SMTP sortant.',
                'is_public'   => false,
            ],
            [
                'key'         => 'smtp_port',
                'value'       => '587',
                'type'        => 'string',
                'group'       => 'email',
                'label'       => 'Port SMTP',
                'description' => 'Port du serveur SMTP (ex : 587, 465, 25).',
                'is_public'   => false,
            ],
            [
                'key'         => 'smtp_user',
                'value'       => null,
                'type'        => 'string',
                'group'       => 'email',
                'label'       => 'Utilisateur SMTP',
                'description' => 'Identifiant de connexion au serveur SMTP.',
                'is_public'   => false,
            ],
            [
                'key'         => 'smtp_password',
                'value'       => null,
                'type'        => 'string',
                'group'       => 'email',
                'label'       => 'Mot de passe SMTP',
                'description' => 'Mot de passe de connexion au serveur SMTP.',
                'is_public'   => false,
            ],

            // --- maintenance ---
            [
                'key'         => 'maintenance_mode',
                'value'       => 'false',
                'type'        => 'boolean',
                'group'       => 'maintenance',
                'label'       => 'Mode maintenance',
                'description' => 'Active ou désactive le mode maintenance de la plateforme.',
                'is_public'   => false,
            ],
            [
                'key'         => 'maintenance_message',
                'value'       => null,
                'type'        => 'string',
                'group'       => 'maintenance',
                'label'       => 'Message de maintenance',
                'description' => 'Message affiché aux utilisateurs en mode maintenance.',
                'is_public'   => true,
            ],
        ];

        $now  = now();
        $rows = array_map(static function (array $setting) use ($now): array {
            return array_merge($setting, [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }, $settings);

        DB::table('system_settings')->upsert(
            $rows,
            ['key'],
            ['value', 'type', 'group', 'label', 'description', 'is_public', 'updated_at']
        );
    }
}
