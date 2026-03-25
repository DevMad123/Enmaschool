# ENMA SCHOOL — PROMPT : PARAMÈTRES DE L'ÉCOLE
## SchoolSettingsPage — Implémentation complète des 5 onglets

---

> **Contexte :** La page `/school/settings` existe avec 5 onglets
> (Général, Académique, Notes & Évaluations, Présences, Notifications)
> mais tous les onglets sont vides.
> Ce prompt implémente le backend (seeder + API) et le frontend complet.

---

## PROMPT À COLLER

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18 / React 18 + TypeScript 5
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)
Auth : Laravel Sanctum + Spatie Permission

Phases terminées : Phase 0 → Phase 12

## TABLE school_settings (déjà existante — Phase 2)

Schéma :
  id
  key        (string, unique) — clé du paramètre  ex: 'school_name'
  value      (text)           — valeur stockée (toujours en string, castée selon type)
  type       (enum: string/integer/boolean/json/float)
  group      (enum: general/academic/grading/attendance/fees/notifications)
  label      (string)         — libellé affiché dans l'UI
  description (text, nullable)— aide contextuelle
  timestamps

## SERVICE EXISTANT (SchoolSettingService.php — Phase 2)

  getAll() : Collection
  getByGroup(SettingGroup $group) : Collection
  update(string $key, mixed $value) : SchoolSetting
  bulkUpdate(array $settings) : void

  + SchoolSetting::get(string $key, mixed $default) — cache Redis

## PROBLÈME ACTUEL

La table school_settings est VIDE → les onglets affichent des champs
sans valeurs. Il manque :
  1. Un seeder avec tous les paramètres par défaut
  2. Des endpoints API pour lire/sauvegarder par groupe
  3. L'implémentation des 5 onglets dans le frontend

---

## PARTIE 1 — BACKEND

### A. SchoolSettingsSeeder.php

Créer database/seeders/tenant/SchoolSettingsSeeder.php

Ce seeder insère TOUS les paramètres avec leurs valeurs par défaut.
Utiliser updateOrInsert() pour être idempotent (safe à rejouer).

Liste COMPLÈTE des paramètres à créer :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP : general
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| key | type | default | label |
|-----|------|---------|-------|
| school_name | string | 'Mon École' | Nom de l'école |
| school_short_name | string | '' | Nom abrégé (sigle) |
| school_address | string | '' | Adresse |
| school_city | string | 'Abidjan' | Ville |
| school_phone | string | '' | Téléphone principal |
| school_phone_2 | string | '' | Téléphone secondaire |
| school_email | string | '' | Email de contact |
| school_website | string | '' | Site web |
| school_director_name | string | '' | Nom du directeur/directrice |
| school_motto | string | '' | Devise de l'école |
| school_founded_year | integer | 2000 | Année de fondation |
| school_logo_path | string | '' | Chemin du logo |
| country | string | 'CI' | Pays |
| timezone | string | 'Africa/Abidjan' | Fuseau horaire |
| language | string | 'fr' | Langue |
| currency | string | 'XOF' | Devise |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP : academic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| key | type | default | label |
|-----|------|---------|-------|
| school_start_time | string | '07:30' | Heure de début des cours |
| school_end_time | string | '17:00' | Heure de fin des cours |
| class_duration_minutes | integer | 60 | Durée d'un cours (minutes) |
| break_duration_minutes | integer | 30 | Durée de la récréation (minutes) |
| lunch_break_start | string | '13:00' | Début de la pause déjeuner |
| lunch_break_end | string | '15:00' | Fin de la pause déjeuner |
| school_days | json | '[1,2,3,4,5]' | Jours scolaires (1=Lundi...6=Samedi) |
| max_students_per_class | integer | 40 | Effectif maximum par classe |
| academic_year_format | string | '{start}-{end}' | Format nom année scolaire |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP : grading
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| key | type | default | label |
|-----|------|---------|-------|
| grading_scale | integer | 20 | Barème de notation (sur X) |
| passing_average | float | 10.0 | Moyenne de passage |
| grade_rounding | string | 'half_up' | Arrondi des notes (half_up / floor / ceil) |
| grade_decimal_places | integer | 2 | Décimales affichées |
| show_rank_in_report | boolean | true | Afficher le rang dans le bulletin |
| show_class_average | boolean | true | Afficher la moyenne de classe |
| show_min_max_in_report | boolean | true | Afficher min/max dans le bulletin |
| absence_counts_as_zero | boolean | false | Une absence compte comme 0 |
| allow_grade_override | boolean | false | Autoriser la modification des notes verrouillées |
| grade_mentions | json | '{"16":"Très Bien","14":"Bien","12":"Assez Bien","10":"Passable","0":"Insuffisant"}' | Mentions par seuil de note |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP : attendance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| key | type | default | label |
|-----|------|---------|-------|
| attendance_risk_threshold | float | 80.0 | Seuil d'alerte de présence (%) |
| late_threshold_minutes | integer | 15 | Délai avant de marquer "en retard" (min) |
| justify_absence_deadline_days | integer | 3 | Délai pour justifier une absence (jours) |
| auto_mark_absent | boolean | false | Marquer absent automatiquement si appel non fait |
| count_late_as_absent | boolean | false | Comptabiliser les retards comme absences |
| max_unjustified_absences | integer | 10 | Nb max absences non justifiées avant alerte |
| notify_absence_immediately | boolean | true | Notifier l'admin à chaque absence |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP : fees  (pour les frais scolaires — Phase 10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| key | type | default | label |
|-----|------|---------|-------|
| payment_reminder_days | integer | 7 | Rappel avant échéance (jours) |
| overdue_notification_days | integer | 3 | Notif après dépassement échéance (jours) |
| allow_partial_payment | boolean | true | Autoriser les paiements partiels |
| max_installments | integer | 3 | Nombre max de tranches |
| generate_receipt_automatically | boolean | true | Générer le reçu PDF automatiquement |
| receipt_footer_text | string | 'Ce reçu est un document officiel.' | Pied de page des reçus |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROUP : notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| key | type | default | label |
|-----|------|---------|-------|
| notify_bulletin_published | boolean | true | Notifier à la publication d'un bulletin |
| notify_absence_recorded | boolean | true | Notifier à chaque absence signalée |
| notify_justification_submitted | boolean | true | Notifier à chaque justification soumise |
| notify_payment_overdue | boolean | true | Notifier pour les paiements en retard |
| notify_timetable_change | boolean | true | Notifier les changements d'emploi du temps |
| email_notifications_enabled | boolean | false | Activer les notifications par email |
| email_sender_name | string | 'Enma School' | Nom d'expéditeur des emails |
| email_sender_address | string | '' | Adresse email d'expéditeur |
| admin_notification_email | string | '' | Email de l'administrateur pour les alertes |

NB : Le seeder doit être déclenché dans DatabaseSeeder.php (tenant)
     ET accessible via : php artisan tenants:seed --class=SchoolSettingsSeeder

### B. Vérification et mise à jour de SchoolSettingController.php

Vérifier que les endpoints suivants existent et fonctionnent :

GET  /api/school/settings
  → Retourne TOUS les settings groupés :
  {
    "success": true,
    "data": {
      "general": [
        { "key": "school_name", "value": "Mon École", "type": "string",
          "label": "Nom de l'école", "description": null },
        ...
      ],
      "academic": [...],
      "grading": [...],
      "attendance": [...],
      "fees": [...],
      "notifications": [...]
    }
  }

GET  /api/school/settings?group=general
  → Retourne seulement le groupe demandé (array flat)

PUT  /api/school/settings/{key}
  → Met à jour un seul setting
  → Body : { "value": "Nouvelle valeur" }
  → Cast automatique selon le type (boolean, integer, float, json)

PUT  /api/school/settings (bulk)
  → Met à jour plusieurs settings d'un coup
  → Body : {
      "settings": [
        { "key": "school_name", "value": "École Sainte-Marie" },
        { "key": "school_phone", "value": "+225 07 00 00 00" },
        ...
      ]
    }
  → Transaction atomique : tout passe ou rien
  → Invalider le cache Redis de chaque key modifiée

IMPORTANT sur le cache :
  SchoolSetting::get() utilise Cache::remember("school_setting_{$key}", 3600, ...)
  → Après update → Cache::forget("school_setting_{$key}")

UPLOAD LOGO :
  POST /api/school/settings/logo
  → Body : multipart, champ "logo" (image, max 2MB, min 100×100px)
  → Stocker dans storage/app/tenant_{slug}/logo.{ext}
  → Mettre à jour school_settings.school_logo_path
  → Retourner l'URL publique du logo

GET /api/school/settings/logo
  → Retourner l'URL publique du logo actuel (ou null)

---

## PARTIE 2 — FRONTEND

### A. Types TypeScript

src/modules/school/types/settings.types.ts

```typescript
export type SettingType = 'string' | 'integer' | 'boolean' | 'json' | 'float';
export type SettingGroup =
  'general' | 'academic' | 'grading' | 'attendance' | 'fees' | 'notifications';

export interface SchoolSetting {
  key: string;
  value: string | number | boolean | Record<string, unknown> | null;
  type: SettingType;
  group: SettingGroup;
  label: string;
  description: string | null;
}

export interface SchoolSettingsGrouped {
  general: SchoolSetting[];
  academic: SchoolSetting[];
  grading: SchoolSetting[];
  attendance: SchoolSetting[];
  fees: SchoolSetting[];
  notifications: SchoolSetting[];
}

// Pour le formulaire — valeurs castées
export type SettingValue = string | number | boolean | Record<string, unknown>;

export interface SettingUpdatePayload {
  key: string;
  value: SettingValue;
}
```

### B. API

src/modules/school/api/settings.api.ts

```typescript
import { apiClient } from '@/shared/lib/axios';

export const settingsApi = {
  getAll: () =>
    apiClient.get<ApiSuccess<SchoolSettingsGrouped>>('/school/settings'),

  getByGroup: (group: SettingGroup) =>
    apiClient.get<ApiSuccess<SchoolSetting[]>>(
      `/school/settings?group=${group}`),

  updateOne: (key: string, value: SettingValue) =>
    apiClient.put<ApiSuccess<SchoolSetting>>(
      `/school/settings/${key}`, { value }),

  bulkUpdate: (settings: SettingUpdatePayload[]) =>
    apiClient.put<ApiSuccess<void>>(
      '/school/settings', { settings }),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post<ApiSuccess<{ url: string }>>(
      '/school/settings/logo', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
```

### C. Hooks

src/modules/school/hooks/useSettings.ts

```typescript
// useSettings — charge tous les settings groupés
export function useSettings() {
  return useQuery({
    queryKey: ['school-settings'],
    queryFn: () => settingsApi.getAll().then(r => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// useBulkUpdateSettings — sauvegarde en masse
export function useBulkUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.bulkUpdate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-settings'] });
      toast.success('Paramètres sauvegardés');
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });
}

// useUploadLogo
export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.uploadLogo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-settings'] });
      toast.success('Logo mis à jour');
    },
  });
}
```

### D. Implémentation de SchoolSettingsPage.tsx

Fichier : src/modules/school/pages/SchoolSettingsPage.tsx

STRUCTURE GLOBALE :
  - Titre "Paramètres de l'école"
  - 5 onglets (shadcn Tabs)
  - Chaque onglet = formulaire React Hook Form + Zod
  - Bouton [💾 Sauvegarder] par onglet (en bas à droite)
  - Auto-save optionnel (pas pour cet écran — trop critique)
  - Toast succès/erreur après sauvegarde

PATTERN PAR ONGLET :
  1. Charger les settings du groupe via useSettings()
  2. Pré-remplir le formulaire avec les valeurs actuelles
  3. On submit → bulkUpdate({ settings: dirtyFields })
  4. Invalider le cache

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONGLET 1 — Général
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Section "Identité de l'école" :
  - [LOGO] Upload logo avec preview
    → Zone drag & drop ou clic pour parcourir
    → Aperçu circulaire du logo actuel
    → Bouton [Changer] + [Supprimer]
    → Formats acceptés : PNG, JPG, SVG | Max 2MB

  - Nom de l'école *        → Input text
  - Nom abrégé (sigle)      → Input text (max 10 chars)
  - Devise de l'école       → Input text (ex: "Per aspera ad astra")
  - Nom du directeur *      → Input text
  - Année de fondation      → Input number (min: 1900, max: année courante)

Section "Coordonnées" :
  - Adresse                 → Textarea (2 lignes)
  - Ville                   → Input text (défaut: Abidjan)
  - Téléphone principal     → Input tel (format: +225 XX XX XX XX XX)
  - Téléphone secondaire    → Input tel (optionnel)
  - Email de contact        → Input email
  - Site web                → Input url (optionnel)

Section "Paramètres régionaux" (en ligne sur 3 colonnes) :
  - Pays                    → Select (CI — Côte d'Ivoire uniquement pour l'instant)
  - Fuseau horaire          → Select (Africa/Abidjan par défaut)
  - Langue                  → Select (Français uniquement pour l'instant)
  - Devise                  → Input text (XOF — non modifiable, affiché en readonly)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONGLET 2 — Académique
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Section "Horaires" :
  - Heure de début des cours  → Input time (ex: 07:30)
  - Heure de fin des cours    → Input time (ex: 17:00)
  - Durée d'un cours          → Input number + "minutes" (défaut: 60)
  - Durée de la récréation    → Input number + "minutes" (défaut: 30)

Section "Pause déjeuner" :
  - Début pause déjeuner    → Input time (ex: 13:00)
  - Fin pause déjeuner      → Input time (ex: 15:00)

Section "Jours scolaires" :
  - Jours de classe → Checkboxes inline :
    ☑ Lundi  ☑ Mardi  ☑ Mercredi  ☑ Jeudi  ☑ Vendredi  ☐ Samedi
    (stocké en JSON : [1,2,3,4,5])

Section "Organisation" :
  - Effectif max par classe   → Input number (min:1, max:100, défaut:40)

AVERTISSEMENT (Card orange) :
  ⚠️ "La modification des horaires impacte la génération de l'emploi
     du temps. Pensez à mettre à jour les créneaux après modification."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONGLET 3 — Notes & Évaluations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Section "Système de notation" :
  - Barème de notation       → Select : [Sur 20] [Sur 100] [Sur 10]
    (valeur stockée : 20, 100 ou 10)
  - Moyenne de passage       → Input decimal (défaut: 10.0, min:0, max: barème)
    → Afficher : "sur {grading_scale}" à côté

  - Arrondi des notes        → Radio :
    ◉ Standard (0.5 → arrondi supérieur)
    ○ Troncature (toujours à l'inférieur)
    ○ Arrondi supérieur (toujours)

  - Décimales affichées      → Select : [0] [1] [2]

Section "Affichage dans les bulletins" :
  - ☑ Afficher le rang de l'élève dans la classe
  - ☑ Afficher la moyenne de la classe
  - ☑ Afficher les notes min/max de la classe

Section "Règles de notation" :
  - ☐ Une absence à une évaluation compte comme zéro
    → Info : "Si désactivé, l'absence est ignorée dans le calcul"
  - ☐ Autoriser la modification des notes verrouillées
    → Info : "Réservé aux school_admin uniquement"

Section "Mentions" :
  - Tableau éditable des mentions :

  | De | À    | Mention      |
  |----|------|--------------|
  | 16 | 20   | Très Bien    |
  | 14 | 15.99| Bien         |
  | 12 | 13.99| Assez Bien   |
  | 10 | 11.99| Passable     |
  | 0  | 9.99 | Insuffisant  |

  → Champs éditables : seuil + label
  → Bouton [+ Ajouter une mention] / [Supprimer]
  → Stocké en JSON : {"16":"Très Bien","14":"Bien",...}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONGLET 4 — Présences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Section "Seuils et alertes" :
  - Seuil d'alerte de présence → Input number + "%" (défaut: 80)
    → Barre de preview : "En dessous de 80% = élève à risque"
  - Délai "en retard"          → Input number + "minutes" (défaut: 15)
    → "Un élève arrivé après X minutes est marqué 'En retard'"
  - Absences non justifiées max→ Input number (défaut: 10)
    → "Alerte déclenchée au-delà de X absences non justifiées"

Section "Justifications" :
  - Délai pour justifier       → Input number + "jours" (défaut: 3)
    → "Une absence peut être justifiée jusqu'à X jours après"

Section "Règles automatiques" :
  - ☐ Marquer absent automatiquement si l'appel n'est pas fait
    → Input : "Après combien d'heures ?" [  2  ] heures
  - ☐ Comptabiliser les retards comme des absences partielles
  - ☑ Notifier l'admin à chaque nouvelle absence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONGLET 5 — Notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Section "Notifications application" :
  Chaque ligne = Switch (ON/OFF) + description :

  ☑ Bulletin publié
    "Notifier les enseignants concernés à la publication d'un bulletin"
  ☑ Absence signalée
    "Notifier l'administration quand une absence est enregistrée"
  ☑ Justification soumise
    "Notifier quand une justification d'absence est soumise"
  ☑ Paiement en retard
    "Notifier la comptabilité pour les frais scolaires en retard"
  ☑ Changement d'emploi du temps
    "Notifier les enseignants affectés en cas de modification"

Section "Notifications email" :
  - ☐ Activer les notifications par email
    → Si activé, afficher les champs :
      - Nom d'expéditeur    → Input text (défaut: "Enma School")
      - Email d'expéditeur  → Input email
      - Email administrateur→ Input email (destinataire des alertes)

  Note info : "Les emails nécessitent une configuration SMTP.
              Contactez votre administrateur système."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### E. Composants à créer

1. LogoUpload.tsx
   Props: { currentUrl: string | null; onUpload: fn; onRemove?: fn }
   → Zone drag & drop avec preview circulaire
   → Affiche initiales de l'école si pas de logo (comme UserAvatar)

2. SettingSwitch.tsx
   Props: { label: string; description?: string; value: boolean; onChange: fn }
   → Toggle Switch shadcn avec label + description
   → Utilisé pour les paramètres boolean

3. MentionsEditor.tsx
   Props: { value: Record<string, string>; onChange: fn }
   → Tableau éditable des mentions (seuil → libellé)
   → Ajouter / Supprimer des lignes
   → Valider : seuils non dupliqués, triés décroissant

4. DaySelector.tsx
   Props: { value: number[]; onChange: fn }
   → Boutons toggle : Lun / Mar / Mer / Jeu / Ven / Sam
   → Selected = fond coloré

5. TimeInput.tsx
   Props: { value: string; onChange: fn; label: string }
   → Input time stylisé (HH:mm)
   → Compatible avec les valeurs "07:30", "17:00"

---

## ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. php artisan tenants:seed --class=SchoolSettingsSeeder --tenants=demo
   → Vérifier : SELECT * FROM school_settings; (doit avoir ~50 rows)

2. Vérifier les endpoints existants dans Hoppscotch :
   GET http://demo.enmaschool.test/api/school/settings
   → Doit retourner les settings groupés

3. Si l'endpoint n'existe pas encore → implémenter SchoolSettingController
   avec les méthodes : index, update (single), bulkUpdate, uploadLogo

4. Implémenter le frontend :
   → types/settings.types.ts
   → api/settings.api.ts
   → hooks/useSettings.ts
   → pages/SchoolSettingsPage.tsx (5 onglets)
   → composants : LogoUpload, SettingSwitch, MentionsEditor, DaySelector, TimeInput

5. Tester chaque onglet :
   → Chargement des valeurs depuis la DB
   → Modification + sauvegarde
   → Rechargement = valeurs persistées
   → Cache Redis invalidé après sauvegarde

---

## VALIDATION ZOD PAR ONGLET

### Onglet Général
const generalSchema = z.object({
  school_name: z.string().min(2, "Nom obligatoire").max(200),
  school_short_name: z.string().max(10).optional(),
  school_director_name: z.string().min(2, "Nom du directeur obligatoire"),
  school_address: z.string().optional(),
  school_city: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().email("Email invalide").optional().or(z.literal('')),
  school_website: z.string().url("URL invalide").optional().or(z.literal('')),
  school_motto: z.string().max(200).optional(),
  school_founded_year: z.number().int().min(1900).max(new Date().getFullYear()),
});

### Onglet Académique
const academicSchema = z.object({
  school_start_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  school_end_time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  class_duration_minutes: z.number().int().min(30).max(180),
  break_duration_minutes: z.number().int().min(5).max(60),
  lunch_break_start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  lunch_break_end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  school_days: z.array(z.number().int().min(1).max(6)).min(1, "Au moins 1 jour requis"),
  max_students_per_class: z.number().int().min(1).max(200),
}).refine(d => d.school_end_time > d.school_start_time, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ['school_end_time'],
});

### Onglet Notes
const gradingSchema = z.object({
  grading_scale: z.number().int().refine(v => [10, 20, 100].includes(v)),
  passing_average: z.number().min(0),
  grade_rounding: z.enum(['half_up', 'floor', 'ceil']),
  grade_decimal_places: z.number().int().min(0).max(2),
  show_rank_in_report: z.boolean(),
  show_class_average: z.boolean(),
  show_min_max_in_report: z.boolean(),
  absence_counts_as_zero: z.boolean(),
  allow_grade_override: z.boolean(),
}).refine(d => d.passing_average <= d.grading_scale, {
  message: "La moyenne de passage ne peut pas dépasser le barème",
  path: ['passing_average'],
});

### Onglet Présences
const attendanceSchema = z.object({
  attendance_risk_threshold: z.number().min(0).max(100),
  late_threshold_minutes: z.number().int().min(1).max(60),
  justify_absence_deadline_days: z.number().int().min(1).max(30),
  auto_mark_absent: z.boolean(),
  count_late_as_absent: z.boolean(),
  max_unjustified_absences: z.number().int().min(1).max(50),
  notify_absence_immediately: z.boolean(),
});

### Onglet Notifications
const notificationsSchema = z.object({
  notify_bulletin_published: z.boolean(),
  notify_absence_recorded: z.boolean(),
  notify_justification_submitted: z.boolean(),
  notify_payment_overdue: z.boolean(),
  notify_timetable_change: z.boolean(),
  email_notifications_enabled: z.boolean(),
  email_sender_name: z.string().optional(),
  email_sender_address: z.string().email().optional().or(z.literal('')),
  admin_notification_email: z.string().email().optional().or(z.literal('')),
});

---

## TESTS À EFFECTUER APRÈS IMPLÉMENTATION

```bash
# 1. Seeder
php artisan tenants:seed --class=SchoolSettingsSeeder --tenants=demo
# → Vérifier : 50+ rows dans school_settings

# 2. API
# GET all settings
curl -H "Authorization: Bearer {token}" \
     http://demo.enmaschool.test/api/school/settings
# → JSON avec 6 groupes, ~50 settings

# GET par groupe
curl -H "Authorization: Bearer {token}" \
     "http://demo.enmaschool.test/api/school/settings?group=general"

# PUT single
curl -X PUT -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"value":"École Sainte-Marie de Cocody"}' \
     http://demo.enmaschool.test/api/school/settings/school_name

# PUT bulk
curl -X PUT -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"settings":[{"key":"school_name","value":"Test"},{"key":"passing_average","value":10.5}]}' \
     http://demo.enmaschool.test/api/school/settings

# 3. Frontend
# → Naviguer vers http://demo.enmaschool.com:8000/school/settings
# → Onglet Général : vérifier que les champs sont pré-remplis
# → Modifier le nom → Sauvegarder → Recharger → valeur persistée
# → Tester le logo upload
# → Tester chaque onglet

# 4. Cache
# → Sauvegarder school_name
# → Vérifier dans Redis : redis-cli GET "school_setting_school_name"
# → Doit retourner la nouvelle valeur après sauvegarde
```
```
