
ENMA SCHOOL — CONTEXTE PROJET COMPLET                 
Document de transfert entre sessions Claude           
Généré le : Mars 2026                                 


1. PRÉSENTATION DU PROJET

Nom : Enma School
Type : SaaS EdTech multi-tenant — Gestion scolaire complète
Cible : Établissements scolaires ivoiriens
         (maternelle, primaire, collège, lycée)
Modèle : Abonnement mensuel/annuel par école
Développeur : Solo + Claude Opus 4.6 comme co-développeur


2. STACK TECHNIQUE DÉFINITIVE

BACKEND :
- PHP 8.3 / Laravel 12
- PostgreSQL 18 (schema-per-tenant via stancl/tenancy v3)
- Laravel Sanctum (auth API tokens)
- Spatie Laravel Permission (rôles & permissions)
- Laravel Horizon (queues, driver Redis)
- Laravel Reverb (WebSocket temps réel)
- Redis 7 (cache, sessions, queues)
- Maatwebsite/Laravel-Excel (import/export)
- Barryvdh/Laravel-DomPDF (bulletins PDF)

FRONTEND :
- React 18 + TypeScript 5 + Vite
- Tailwind CSS v3 + shadcn/ui
- TanStack Query v5 (fetching/cache)
- TanStack Table v8 (tableaux avancés)
- React Router v6
- Zustand v4 (state management, persisté localStorage)
- React Hook Form + Zod (formulaires/validation)
- Axios (client HTTP + intercepteurs)
- Recharts (graphiques)
- FullCalendar (emploi du temps — phase 8)

MOBILE (prévu V2) :
- Flutter

ENVIRONNEMENT LOCAL :
- Laragon (Windows) + PostgreSQL 18.2
- Adminer (interface DB, mot de passe défini via psql)
- Hoppscotch (tests API)
- VS Code


3. ARCHITECTURE MULTI-TENANT

Stratégie : schema-per-tenant PostgreSQL (stancl/tenancy v3)

Schema central (public) :
  → tenants, tenant_profiles, domains, plans, super_admins
  → plan_modules, system_modules, subscriptions
  → tenant_modules, activity_logs, support_tickets
  → ticket_replies, system_settings

Schema tenant (un par école) :
  → users, school_settings, academic_years, periods
  → school_levels, classes, subjects, class_subjects, rooms
  → teachers, students, parents, grades, report_cards
  → attendances, timetable_slots, messages, notifications...

Résolution tenant : sous-domaine → {slug}.enmaschool.com
Exemple local : demo.enmaschool.test


4. STRUCTURE DES ÉTABLISSEMENTS

Une école peut combiner plusieurs niveaux.
Stocké dans la table tenants via 4 colonnes booléennes :

  has_maternelle  BOOLEAN  (seulement si has_primary = true)
  has_primary     BOOLEAN
  has_college     BOOLEAN
  has_lycee       BOOLEAN

Règles métier :
  - Au moins un de has_primary, has_college, has_lycee = true
  - has_maternelle ne peut être true que si has_primary = true

Accessor : getSchoolTypesLabelAttribute()
  → ex: "Maternelle + Primaire + Collège + Lycée"


5. SYSTÈME SCOLAIRE IVOIRIEN

MATERNELLE :
  Petite Section (PS), Moyenne Section (MS), Grande Section (GS)

PRIMAIRE :
  CP1, CP2, CE1, CE2, CM1, CM2

COLLÈGE :
  6ème, 5ème, 4ème, 3ème

LYCÉE :
  2nde, 1ère, Terminale
  + Série obligatoire pour 1ère et Terminale :
    A, B, C, D, F1, F2, G1, G2, G3
  + Section pour toutes les classes : 1, 2, 3, A, B, C...

Format display_name des classes (généré automatiquement) :
  - Avec série : "{short_label} {serie}{section}"
    ex: "Tle C1", "1ère A2", "1ère D3"
  - Sans série : "{label} {section}"
    ex: "6ème 3", "CP1 A", "PS B", "CM2 2"

IMPORTANT : La 2nde n'a PAS de série en Côte d'Ivoire.
Seules 1ère et Terminale ont des séries.

6. RÔLES UTILISATEURS

Niveau plateforme (schema central) :
  super_admin → accès total à la plateforme SaaS

Niveau école (schema tenant) :
  school_admin → gestion complète de l'école
  director     → directeur (accès large, légèrement < admin)
  teacher      → enseignant (ses classes, notes, présences)
  accountant   → comptable (frais scolaires)
  staff        → personnel administratif
  student      → élève (consultation — V2)
  parent       → parent (consultation — V2)

Gestion : Spatie Laravel Permission
  → tables dédiées auto-créées (model_has_roles, etc.)
  → colonne "role" dans users = cache dénormalisé pour perf

7. SYSTÈME DE MODULES

Modules disponibles (clés) :
  grades       → Notes & Évaluations (CORE, non désactivable)
  attendance   → Présences (CORE)
  timetable    → Emploi du temps
  payments     → Frais scolaires
  elearning    → E-Learning
  messaging    → Messagerie
  reports      → Rapports & Statistiques
  library      → Bibliothèque
  transport    → Transport

Plans tarifaires :
  Starter  : grades, attendance, timetable, messaging
  Pro      : + payments, reports, elearning
  Premium  : tous les modules (illimité)

Trial : 30 jours gratuits à la création de l'école

Tables :
  system_modules    → définition des modules (central)
  plan_modules      → modules par plan (central)
  tenant_modules    → overrides par école (central)

Middleware CheckModuleAccess → 403 si module désactivé

8. TABLES PRINCIPALES (résumé)

CENTRAL :
  plans(id, name, slug, price_monthly, price_yearly,
        trial_days, max_students, max_teachers,
        max_storage_gb, features jsonb, is_active)

  tenants(id uuid, name, slug, status enum, plan_id,
          trial_ends_at, has_maternelle, has_primary,
          has_college, has_lycee, timestamps)

  tenant_profiles(id, tenant_id unique, logo, address,
                  phone, email, website, city,
                  country default 'CI',
                  timezone default 'Africa/Abidjan',
                  language default 'fr',
                  currency default 'XOF')

  domains(id, domain unique, tenant_id, is_primary,
          is_verified, verified_at)

  super_admins(id, name, email, password, last_login_at)

  system_modules(id, key unique, name, description,
                 icon, is_core, is_active, available_for jsonb,
                 order)

  plan_modules(id, plan_id, module_key, is_enabled)
  UNIQUE(plan_id, module_key)

  subscriptions(id, tenant_id, plan_id, status enum,
                starts_at, ends_at, trial_ends_at,
                cancelled_at, price_paid, billing_cycle)

  tenant_modules(id, tenant_id, module_key, is_enabled,
                 enabled_at, disabled_at, override_reason)

  activity_logs(id, log_type, actor_type, actor_id,
                actor_name, tenant_id, activity_type,
                description, properties jsonb, created_at)
  NB : pas de updated_at (logs immuables)

  support_tickets(id, tenant_id, subject, description,
                  status enum, priority enum, assigned_to,
                  resolved_at)

  ticket_replies(id, ticket_id, author_type, message)

  system_settings(id, key unique, value, type enum,
                  group enum, label, is_public)

TENANT :
  school_settings(id, key unique, value, type enum,
                  group enum, label, description)

  academic_years(id, name, status enum, start_date,
                 end_date, period_type enum, is_current,
                 passing_average decimal, promotion_type enum,
                 closed_at, created_by)

  periods(id, academic_year_id, name, type enum, order,
          start_date, end_date, is_current, is_closed)
  UNIQUE(academic_year_id, order)

  school_levels(id, code unique, category enum, label,
                short_label, order, requires_serie, is_active)
  NB : pré-rempli par seeder, non créé par l'admin

  classes(id, academic_year_id, school_level_id,
          main_teacher_id nullable, room_id nullable,
          serie varchar nullable, section varchar,
          display_name varchar calculé auto,
          capacity default 40, is_active, soft_deletes)
  UNIQUE(academic_year_id, school_level_id, serie, section)

  subjects(id, name, code unique, coefficient decimal,
           color hex, category enum nullable, is_active)

  class_subjects(id, class_id, subject_id,
                 coefficient_override nullable,
                 hours_per_week nullable, is_active)
  UNIQUE(class_id, subject_id)

  rooms(id, name, code unique nullable, type enum,
        capacity, floor, building, equipment jsonb, is_active)

  users(id, first_name, last_name, email unique, password,
        avatar, phone, role enum, status enum,
        last_login_at, settings jsonb, soft_deletes)
  NB : settings jsonb = préférences UI (jamais filtré → JSON ok)

9. CONVENTIONS DE CODE

LARAVEL :
  ✓ strict_types=1 sur tous les fichiers PHP
  ✓ Typage strict natif PHP 8.3 (return types, property types)
  ✓ Enums PHP 8.1 pour toutes les valeurs fixes
  ✓ Jamais de logique dans les Controllers → Services
  ✓ API Resources pour TOUTES les réponses API
  ✓ Form Requests pour toutes les validations
  ✓ Trait ApiResponse dans tous les Controllers
  ✓ Soft deletes sur toutes les entités principales

  Format réponse uniforme (Trait ApiResponse) :
    success → { success: true, data: {...}, message: "..." }
    error   → { success: false, message: "...", errors: {...} }
    paginated → { success: true, data: [...],
                  meta: { current_page, last_page, per_page,
                           total, from, to },
                  links: { first, last, prev, next } }

REACT :
  ✓ TypeScript strict, zéro any
  ✓ Toute logique dans des custom hooks (jamais dans composants)
  ✓ Interfaces pour tous les types API
  ✓ Fichiers : PascalCase composants, camelCase hooks/utils
  ✓ Extensions : .tsx pour composants, .ts pour le reste

NOMMAGE :
  Model Laravel : "Classe" (pas "Class" — réservé PHP)
  Table Laravel : "classes" (nom au pluriel normal)

10. STRUCTURE FRONTEND

src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx          (ProtectedRoute + RoleRoute)
│   └── providers.tsx       (QueryClient + auth init)
├── modules/
│   ├── auth/               (LoginPage, authStore, auth.api)
│   ├── superadmin/         (Phase 1 — interface superadmin)
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/SuperAdminLayout.tsx
│   │   ├── pages/
│   │   ├── store/superAdminStore.ts
│   │   └── types/
│   └── school/             (Phase 2 — interface école)
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── store/schoolStore.ts
│       └── types/
├── shared/
│   ├── components/
│   │   ├── layout/         (DashboardLayout, Sidebar, Header)
│   │   ├── ui/             (re-exports shadcn)
│   │   ├── tables/         (DataTable générique TanStack)
│   │   ├── forms/          (composants formulaire réutilisables)
│   │   └── feedback/       (LoadingSpinner, EmptyState,
│   │                        ErrorBoundary, ConfirmDialog)
│   ├── config/
│   │   └── navigation.ts   (NavItem config par rôle)
│   ├── hooks/
│   │   ├── usePermission.ts
│   │   └── useDebounce.ts
│   ├── lib/
│   │   ├── axios.ts        (instance + intercepteurs)
│   │   ├── queryClient.ts  (config TanStack Query)
│   │   └── toast.ts        (wrapper sonner/shadcn toast)
│   └── types/
│       ├── api.types.ts    (PaginatedResponse, ApiSuccess, etc.)
│       └── auth.types.ts   (User, School, AuthState, etc.)
└── stores/
    ├── authStore.ts        (Zustand, persisté localStorage)
    └── uiStore.ts          (sidebar, theme — theme persisté)

11. ROADMAP — ÉTAT D'AVANCEMENT

✅ PHASE 0 — Fondations & Auth (TERMINÉE)
   - Multi-tenant stancl/tenancy configuré
   - PostgreSQL schema-per-tenant
   - Migrations centrales (tenants, domains, plans...)
   - Migration tenant (users)
   - Enums : TenantStatus, UserRole, UserStatus
   - Models : Tenant, TenantProfile, Domain, Plan, User
   - Auth complète : login, logout, me, refresh
   - Middlewares : EnsureTenantIsActive, CheckRole
   - Trait ApiResponse
   - Frontend : LoginPage, DashboardLayout, authStore,
     axios.ts, usePermission.ts, routes.tsx
   - Seeder demo : admin@demo.com / password

✅ PHASE 1 — Interface SuperAdmin (TERMINÉE)
   - Migrations : system_modules, plan_modules, subscriptions,
     tenant_modules, activity_logs, support_tickets,
     ticket_replies, system_settings
   - Enums : ModuleKey, SubscriptionStatus, TicketStatus,
     TicketPriority, ActivityType
   - Models + Services centraux complets
   - Controllers SuperAdmin (Tenant, Plan, Module,
     Subscription, ActivityLog, Support, Settings, Dashboard)
   - Frontend : SuperAdminLayout (dark sidebar),
     DashboardPage, TenantListPage, TenantDetailPage,
     CreateTenantPage (wizard 4 étapes),
     PlanListPage, GlobalUsersPage, SystemModulesPage,
     ActivityLogPage, TicketListPage, TicketDetailPage,
     SystemSettingsPage
   - Composants : TenantStatusBadge, SchoolTypeBadges,
     ModuleToggle, StatsCard, Stepper, DateRangePicker,
     DataTable générique, ConfirmDialog

✅ PHASE 2 — Config École & Structure Académique (EN COURS)
   - Migrations tenant : school_settings, academic_years,
     periods, school_levels, classes, subjects,
     class_subjects, rooms
   - Enums : LevelCategory, LevelCode, LyceeSerie,
     PeriodType, RoomType, SettingType, SettingGroup,
     AcademicYearStatus, StudentPromotionType
   - Models : SchoolSetting, AcademicYear, Period,
     SchoolLevel, Classe, Subject, ClassSubject, Room
   - Services : SchoolSettingService, AcademicYearService,
     ClasseService, SubjectService, RoomService
   - Controllers + Resources + Routes complets
   - Frontend : types, api, hooks, stores
   - Pages : SchoolSettingsPage (5 onglets),
     AcademicYearsPage, SchoolLevelsPage,
     ClassesPage (avec bulk create + preview display_name),
     ClasseDetailPage (tabs), SubjectsPage, RoomsPage
   - Composants : LevelCategoryBadge, SerieSelect,
     ClasseDisplayNamePreview, SubjectColorPicker,
     RoomEquipmentIcons, PeriodTimeline, DatePicker,
     NumberInput, ClasseCard

🔲 PHASE 3 — Rôles & Utilisateurs École
🔲 PHASE 4 — Gestion des Élèves
🔲 PHASE 5 — Enseignants & Affectations
🔲 PHASE 6 — Notes & Évaluations
🔲 PHASE 7 — Bulletins
🔲 PHASE 8 — Emploi du temps
🔲 PHASE 9 — Présences
🔲 PHASE 10 — Frais Scolaires
🔲 PHASE 11 — Communication
🔲 PHASE 12 — Rapports & Dashboard


12. PROCHAINE ÉTAPE — PHASE 3

OBJECTIF : Gestion des rôles et utilisateurs de l'école

Rôles à gérer (côté école, schema tenant) :
  school_admin, director, teacher, accountant, staff

Fonctionnalités prévues :
  - Liste des utilisateurs de l'école
  - Inviter un utilisateur par email
  - Assigner un rôle
  - Créer/modifier des rôles personnalisés
  - Associer des permissions par module aux rôles
  - Désactiver un compte
  - Réinitialiser un mot de passe

NOTE : Students et parents sont gérés dans les phases
       dédiées (4 et 4) — pas dans cette phase.


13. INFORMATIONS TECHNIQUES IMPORTANTES

1. MULTI-TENANT BOOT PATTERN :
   Dans les models tenant, la scope forTenant() récupère
   les flags has_* via : tenant() (helper stancl/tenancy)
   ex: if (!tenant()->has_lycee) → exclude lycee levels

2. DISPLAY_NAME AUTO-GÉNÉRÉ :
   Logique dans Classe::generateDisplayName() :
   if ($level->requires_serie && $this->serie) :
     "{short_label} {serie->shortLabel()}{section}"
   else :
     "{label} {section}"
   Appelé dans boot() → creating ET updating

3. IS_CURRENT PATTERN (AcademicYear & Period) :
   boot() → before creating/updating si is_current = true :
   → mettre tous les autres à is_current = false
   → garantit qu'un seul enregistrement est "current"

4. SCHOOL_LEVELS — PAS DE CRUD ADMIN :
   Les niveaux sont pré-insérés par SchoolLevelSeeder.
   L'admin peut seulement activer/désactiver un niveau.
   La disponibilité est filtrée par scopeForTenant().

5. COEFFICIENT EFFECTIF DES MATIÈRES :
   ClassSubject::getEffectiveCoefficient() :
   → retourne coefficient_override ?? subject->coefficient

6. CACHE DES SETTINGS :
   SchoolSetting::get() utilise Cache::remember()
   Boot() → after save → Cache::forget("setting_{$key}")

7. ACTIVITY LOGS :
   Table sans updated_at (logs immuables)
   const UPDATED_AT = null dans le Model

8. TENANT MODULES OVERRIDE :
   Logique : modules du plan + overrides manuels
   (un tenant peut avoir des modules en plus ou en moins
    de ce que son plan prévoit, sur décision superadmin)


14. MÉTHODE DE TRAVAIL AVEC CLAUDE

RÈGLE D'OR : Une phase = plusieurs sessions courtes
             NE JAMAIS tout mettre dans une seule session

STRUCTURE D'UNE SESSION :
  1. Colle le CONTEXTE GLOBAL de la phase
  2. Indique ce qui est déjà fait
  3. Demande UNIQUEMENT les fichiers de cette session
  4. Teste avant de passer à la session suivante

TEMPLATE PROMPT :
  ## CONTEXTE PROJET
  [résumé stack + ce qui est fait]

  ## CETTE SESSION
  [objectif précis]

  ## CE QUI EST DÉJÀ FAIT
  [liste des fichiers/features existants]

  ## GÉNÈRE MAINTENANT
  [liste précise des fichiers à créer]

ORDRE DE TEST APRÈS CHAQUE SESSION :
  Session backend migrations → php artisan migrate
  Session backend models/services → tester via tinker
  Session backend controllers → Hoppscotch (tous les endpoints)
  Session frontend types/api → console.log des fonctions
  Session frontend pages → test visuel navigateur

CONSEIL SESSIONS LONGUES :
  Si la conversation dépasse 40 échanges → nouvelle session
  Coller ce fichier de contexte en début de nouvelle session


15. CREDENTIALS DE DÉMO (local)

Super Admin :
  URL : (central)
  Email : superadmin@enmaschool.com
  Password : password

École Demo :
  URL : demo.enmaschool.test
  School Admin : admin@demo.com / password
  Directeur : directeur@demo.com / password
  Enseignant : prof@demo.com / password

Base de données :
  Host : 127.0.0.1
  Port : 5432
  User : postgres
  Password : laragon (défini via psql)
  DB name : enma_school


16. VARIABLES D'ENVIRONNEMENT LARAVEL

APP_NAME="Enma School"
APP_ENV=local
APP_URL=http://enmaschool.test

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=enma_school
DB_USERNAME=postgres
DB_PASSWORD=laragon

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

QUEUE_CONNECTION=redis
BROADCAST_CONNECTION=reverb
CACHE_STORE=redis
SESSION_DRIVER=redis

TENANCY_DATABASE_TEMPLATE_CONNECTION=pgsql

SANCTUM_STATEFUL_DOMAINS=demo.enmaschool.test


17. VARIABLES D'ENVIRONNEMENT REACT

VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Enma School
VITE_APP_DOMAIN=enmaschool.test
VITE_APP_VERSION=1.0.0


FIN DU DOCUMENT DE CONTEXTE
Prochaine phase à développer : PHASE 3


PS: la phase 2 a connu quelques ajustement qui ne sont pas dans ce fichier se référé au projet pour plus de précision