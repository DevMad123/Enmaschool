# ENMA SCHOOL — PROMPTS PHASE 3
## Rôles & Utilisateurs École

---

> ## PÉRIMÈTRE DE LA PHASE 3
>
> **Objectif :** Gérer les utilisateurs internes de l'école (staff) et leurs permissions.
>
> **Rôles concernés (schema tenant) :**
> | Rôle | Description | Niveau d'accès |
> |------|-------------|----------------|
> | `school_admin` | Administrateur de l'école | Accès total (tenant) |
> | `director` | Directeur | Accès large, légèrement < admin |
> | `teacher` | Enseignant | Ses classes, notes, présences |
> | `accountant` | Comptable | Module frais scolaires |
> | `staff` | Personnel administratif | Accès limité |
>
> **HORS PÉRIMÈTRE Phase 3 :**
> - `student` et `parent` → gérés en Phase 4
> - Affectation des enseignants aux classes → Phase 5
>
> **Tables nouvelles :**
> - `user_invitations` → système d'invitation par email avec token
>
> **Tables Spatie (auto-créées) :**
> - `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`
>
> **Rappel :** La colonne `role` dans `users` est un cache dénormalisé (enum UserRole)
> pour les performances. Elle doit toujours rester synchronisée avec Spatie.

---

## SESSION 3.1 — Migrations + Seeders

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)
Auth : Laravel Sanctum + Spatie Laravel Permission

Phases terminées :
- Phase 0 : Auth, Users, Middlewares
- Phase 1 : Interface SuperAdmin
- Phase 2 : Config École, Niveaux, Classes, Matières, Salles

Table users (déjà existante dans schema tenant) :
  id, first_name, last_name, email (unique), password,
  avatar, phone, role (enum UserRole), status (enum UserStatus),
  last_login_at, settings (jsonb), soft_deletes, timestamps

Enums existants :
  UserRole : school_admin, director, teacher, accountant, staff, student, parent
  UserStatus : active, inactive, suspended, pending

## CETTE SESSION — Phase 3 : Migrations

## GÉNÈRE LES MIGRATIONS (dans database/migrations/tenant/)

### 1. create_user_invitations_table

Objectif : permettre d'inviter un utilisateur par email avec un lien sécurisé.
L'invité clique sur le lien, définit son mot de passe, et son compte est activé.

Colonnes :
  - id
  - email (string, not unique — plusieurs invitations possibles dans le temps)
  - role (string) — le rôle qui sera assigné à l'acceptation
  - token (string, unique) — UUID ou hash sécurisé
  - invited_by (foreignId → users, nullOnDelete) — qui a envoyé l'invitation
  - accepted_at (timestamp nullable) — null tant que non acceptée
  - expires_at (timestamp) — durée de vie : 72h après création
  - revoked_at (timestamp nullable) — révocation manuelle
  - timestamps

  Index : email, token (unique), expires_at

### 2. Mise à jour de la table users (si besoin)

Vérifier que ces colonnes existent, sinon les ajouter via migration :
  - avatar (string nullable) — URL ou chemin
  - phone (string nullable, max 20)
  - settings (jsonb nullable, default '{}') — préférences UI
  - last_login_at (timestamp nullable)

NB : Si déjà présentes depuis Phase 0, créer une migration vide
     avec commentaire "already exists — no changes needed"

## GÉNÈRE AUSSI LES SEEDERS

### PermissionSeeder.php

Objectif : créer toutes les permissions Spatie et les assigner aux rôles par défaut.

LISTE DES PERMISSIONS (format: module.action) :

// Gestion de l'école
'school.settings.view'
'school.settings.edit'

// Utilisateurs
'users.view'
'users.create'
'users.edit'
'users.delete'
'users.invite'
'users.roles.manage'

// Années scolaires & Structure
'academic_years.view'
'academic_years.manage'
'levels.view'
'levels.manage'
'classes.view'
'classes.manage'
'subjects.view'
'subjects.manage'
'rooms.view'
'rooms.manage'

// Élèves (Phase 4)
'students.view'
'students.create'
'students.edit'
'students.delete'
'students.import'

// Notes (Phase 6)
'grades.view'
'grades.input'
'grades.validate'
'grades.delete'

// Bulletins (Phase 7)
'report_cards.view'
'report_cards.generate'
'report_cards.publish'

// Présences (Phase 9)
'attendance.view'
'attendance.input'
'attendance.reports'

// Frais scolaires (Phase 10)
'payments.view'
'payments.create'
'payments.validate'
'payments.reports'

// Emploi du temps (Phase 8)
'timetable.view'
'timetable.manage'

// Communication (Phase 11)
'messaging.view'
'messaging.send'

// Rapports (Phase 12)
'reports.view'
'reports.export'

ASSIGNATION PAR RÔLE PAR DÉFAUT :

school_admin → TOUTES les permissions (wildcard)

director →
  school.settings.view, users.view, users.create, users.edit,
  academic_years.view, academic_years.manage,
  levels.view, levels.manage, classes.view, classes.manage,
  subjects.view, subjects.manage, rooms.view, rooms.manage,
  students.view, students.create, students.edit, students.import,
  grades.view, grades.validate,
  report_cards.view, report_cards.generate, report_cards.publish,
  attendance.view, attendance.reports,
  payments.view, payments.reports,
  timetable.view, timetable.manage,
  messaging.view, messaging.send,
  reports.view, reports.export

teacher →
  classes.view, subjects.view,
  students.view,
  grades.view, grades.input,
  report_cards.view,
  attendance.view, attendance.input,
  timetable.view,
  messaging.view, messaging.send

accountant →
  students.view,
  payments.view, payments.create, payments.validate, payments.reports,
  reports.view, reports.export

staff →
  students.view, students.create, students.edit,
  classes.view, subjects.view, rooms.view,
  attendance.view,
  messaging.view

NB IMPORTANT :
- Ces rôles sont créés dans le schema TENANT (guard: 'web' + team_id ou schema tenant)
- Utiliser Spatie syncPermissions() pour éviter les doublons
- Le seeder doit être idempotent (runnable plusieurs fois sans erreur)
- Appeler ce seeder dans DatabaseSeeder.php tenant

### RoleDescriptionSeeder.php (optionnel mais recommandé)

Stocker dans school_settings la description des rôles par défaut :
  school_admin → "Accès complet à toutes les fonctionnalités de l'école"
  director     → "Directeur de l'établissement — accès large à la gestion"
  teacher      → "Enseignant — gestion de ses classes, notes et présences"
  accountant   → "Comptable — gestion des frais scolaires uniquement"
  staff        → "Personnel administratif — accès limité"

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan db:seed --class=PermissionSeeder
php artisan tinker
  >>> Spatie\Permission\Models\Role::all()->pluck('name')
  >>> Spatie\Permission\Models\Permission::count()
```

---

## SESSION 3.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1
Gestion permissions : Spatie Laravel Permission

Phase 3 Session 1 terminée :
- Migration user_invitations ✅
- PermissionSeeder ✅ (X permissions, 5 rôles configurés)

## GÉNÈRE LES ENUMS

### app/Enums/UserRole.php (MISE À JOUR si nécessaire)
cases : SchoolAdmin, Director, Teacher, Accountant, Staff, Student, Parent
méthode : label() → libellé français affiché dans l'UI
  school_admin → "Administrateur"
  director     → "Directeur"
  teacher      → "Enseignant"
  accountant   → "Comptable"
  staff        → "Personnel"
  student      → "Élève"
  parent       → "Parent"
méthode : color() → couleur tailwind pour badge
  school_admin → 'purple'
  director     → 'blue'
  teacher      → 'green'
  accountant   → 'orange'
  staff        → 'gray'
  student      → 'cyan'
  parent       → 'pink'
méthode : staffRoles() : array → [SchoolAdmin, Director, Teacher, Accountant, Staff]
  (exclut Student et Parent — gérés dans d'autres phases)
méthode : manageable() : array
  → selon le rôle de l'utilisateur connecté :
    school_admin peut gérer : director, teacher, accountant, staff
    director peut gérer     : teacher, accountant, staff
    (les autres ne peuvent pas gérer les utilisateurs)

### app/Enums/UserStatus.php (MISE À JOUR si nécessaire)
cases : Active, Inactive, Suspended, Pending
méthode : label() → "Actif", "Inactif", "Suspendu", "En attente"
méthode : color() → couleur pour badge

### app/Enums/InvitationStatus.php (NOUVEAU)
Calculé dynamiquement (pas stocké en DB) :
cases : Pending, Accepted, Expired, Revoked
méthode : label(), color()

## GÉNÈRE LE MODEL UserInvitation.php

$fillable : email, role, token, invited_by, accepted_at, expires_at, revoked_at
Casts : accepted_at → datetime, expires_at → datetime, revoked_at → datetime

Relations :
- invitedBy() belongsTo User (FK: invited_by)

Accessors & méthodes :
- getStatusAttribute() : InvitationStatus
  → si revoked_at non null      → Revoked
  → si accepted_at non null     → Accepted
  → si expires_at < now()       → Expired
  → sinon                       → Pending

- isValid() : bool
  → status === InvitationStatus::Pending && expires_at > now()

- scopePending($query) → status Pending
- scopeExpired($query) → expires_at < now() && accepted_at null

Méthode statique : generateToken() : string
  → Str::uuid() ou hash('sha256', Str::random(60))

## MISE À JOUR DU MODEL User.php

Ajouter :
- use HasRoles; (Spatie trait)
- Cast : role → UserRole::class, status → UserStatus::class
- Accessor : getFullNameAttribute() : string → "{$this->first_name} {$this->last_name}"
- Accessor : getAvatarUrlAttribute() : string|null → URL complète ou null
- Méthode : isActive() : bool → status === UserStatus::Active
- Méthode : hasModulePermission(string $module, string $action) : bool
  → utilise Spatie can() → "{$module}.{$action}"
- Scope : scopeStaff($query) → whereIn('role', UserRole::staffRoles())
- Scope : scopeActive($query) → where('status', UserStatus::Active)
- Scope : scopeByRole($query, UserRole $role)

## GÉNÈRE LES SERVICES

### UserService.php

list(array $filters) : LengthAwarePaginator
  filtres : role, status, search (first_name, last_name, email), per_page
  → inclure uniquement les rôles staff (pas student/parent)
  → eager load : roles (Spatie)

create(array $data) : User
  → hash le mot de passe si fourni
  → assigne le rôle Spatie + met à jour la colonne role (cache dénormalisé)
  → dispatch event UserCreated (pour notifications futures)

update(User $user, array $data) : User
  → si role change : mettre à jour Spatie + colonne role en même temps
  → TOUJOURS synchroniser les deux (colonne + Spatie)

updateRole(User $user, UserRole $newRole) : User
  → syncRoles([$newRole->value]) via Spatie
  → $user->role = $newRole → save()
  → log dans activity_logs

activate(User $user) : User
  → status = Active → save()

deactivate(User $user) : User
  → status = Inactive → save()
  → invalider les tokens Sanctum de l'utilisateur

suspend(User $user, string $reason) : User
  → status = Suspended → save()
  → invalider les tokens Sanctum

resetPassword(User $user) : string
  → génère un mot de passe temporaire aléatoire (12 chars)
  → le hash et sauvegarde
  → retourne le mot de passe en clair (pour l'afficher à l'admin une seule fois)
  → invalider les tokens Sanctum existants
  → NB : en production → envoyer par email (Phase 11), pour l'instant retourner le MDP

delete(User $user) : void
  → soft delete seulement
  → vérifier qu'on ne supprime pas le seul school_admin
  → invalider les tokens Sanctum

getPermissions(User $user) : array
  → retourne toutes les permissions effectives (via rôle + directes)

### InvitationService.php

invite(array $data, User $invitedBy) : UserInvitation
  → vérifie qu'il n'existe pas déjà une invitation pending pour cet email
  → vérifie que l'email n'est pas déjà un utilisateur actif
  → crée l'invitation avec token + expires_at = now() + 72h
  → dispatch job SendInvitationEmail (queue mail) — pour l'instant logger uniquement
  → retourne l'invitation avec le lien d'acceptation

accept(string $token, array $data) : User
  → trouve l'invitation via token
  → vérifie isValid() → sinon exception InvitationExpiredException
  → crée le User avec les données + rôle de l'invitation
  → marque accepted_at = now()
  → retourne le User créé + token Sanctum

resend(UserInvitation $invitation, User $resendBy) : UserInvitation
  → vérifie que l'invitation n'est pas déjà acceptée
  → renouvelle expires_at = now() + 72h
  → génère un nouveau token
  → dispatch job SendInvitationEmail

revoke(UserInvitation $invitation) : UserInvitation
  → revoked_at = now() → save()

list(array $filters) : LengthAwarePaginator
  filtres : status (pending/accepted/expired/revoked), email, per_page

### PermissionService.php

getRolesWithPermissions() : Collection
  → retourne tous les rôles Spatie avec leurs permissions groupées par module

updateRolePermissions(string $roleName, array $permissions) : void
  → syncPermissions() sur le rôle
  → NB : school_admin ne peut pas être modifié (toujours all permissions)

getUserPermissions(User $user) : array
  → permissions effectives groupées : ['grades' => ['view','input'], ...]

canManageRole(User $manager, UserRole $targetRole) : bool
  → vérifie les règles métier de UserRole::manageable()

## COMMANDES DE TEST

php artisan tinker
  >>> $service = app(App\Services\UserService::class)
  >>> $service->list(['role' => 'teacher'])
  >>> $user = App\Models\User::first()
  >>> $user->hasPermissionTo('grades.view')
  >>> $user->getRoleNames()
```

---

## SESSION 3.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 3 Sessions 1 & 2 terminées :
- Migrations + Seeders ✅
- Enums, Models, Services ✅

## GÉNÈRE LES API RESOURCES

### UserResource.php
{
  id, first_name, last_name, full_name (accessor),
  email, phone, avatar_url (accessor),
  role: { value, label, color },
  status: { value, label, color },
  last_login_at (formatted),
  created_at (formatted),
  // Relations conditionnelles
  roles: whenLoaded (Spatie roles collection),
  permissions: when($this->relationLoaded('permissions'), ...)
  // Méta
  can: {
    edit: $request->user()->can('users.edit'),
    delete: $request->user()->can('users.delete'),
    manage_role: $request->user()->can('users.roles.manage'),
  }
}

### UserInvitationResource.php
{
  id, email, role: { value, label },
  status: { value, label, color },  // calculé via accessor
  invited_by: { id, full_name },
  expires_at, accepted_at, created_at,
  is_valid (bool),
  invitation_link: lorsqu'en status Pending (URL front-end avec token)
}

### RolePermissionsResource.php
{
  name, label,
  permissions_count,
  permissions_by_module: {
    "grades": ["view", "input", "validate"],
    "attendance": ["view", "input"],
    ...
  }
}

### UserPermissionsResource.php
{
  user_id,
  role: { value, label },
  all_permissions: [ "grades.view", "grades.input", ... ],
  permissions_by_module: {
    "grades": ["view", "input"],
    ...
  }
}

## GÉNÈRE LES FORM REQUESTS

### StoreUserRequest / UpdateUserRequest
Règles :
  - first_name : required, string, max:100
  - last_name  : required, string, max:100
  - email      : required, email, unique:users,email (ignorer sur update)
  - password   : required sur store, nullable sur update, min:8, confirmed
  - role       : required, in: UserRole::staffRoles() (pas student/parent)
  - phone      : nullable, string, max:20
  - avatar     : nullable, url ou file image

### InviteUserRequest
  - email : required, email
    Custom validation :
      * email non déjà utilisateur actif de cette école
      * pas d'invitation pending non expirée pour cet email
  - role  : required, in: UserRole::staffRoles()
  Messages : "Un utilisateur actif avec cet email existe déjà"
             "Une invitation est déjà en attente pour cet email"

### AcceptInvitationRequest
  - token      : required, string
  - first_name : required, string, max:100
  - last_name  : required, string, max:100
  - password   : required, min:8, confirmed
  - phone      : nullable

### UpdateRolePermissionsRequest
  - permissions : required, array
  - permissions.* : string, exists in permissions table

## GÉNÈRE LES CONTROLLERS

### UserController

index() → GET /school/users
  → paginate 20, avec filtres role/status/search
  → eager load roles
  → réponse paginée avec UserResource

store() → POST /school/users
  → middleware permission: users.create
  → crée l'utilisateur + assigne le rôle
  → retourne UserResource

show() → GET /school/users/{user}
  → middleware permission: users.view
  → load roles + permissions
  → retourne UserResource

update() → PUT /school/users/{user}
  → middleware permission: users.edit
  → mise à jour + sync rôle si changé
  → retourne UserResource

destroy() → DELETE /school/users/{user}
  → middleware permission: users.delete
  → interdit de supprimer son propre compte
  → interdit de supprimer le dernier school_admin
  → soft delete + invalider tokens

activate()  → POST /school/users/{user}/activate
  → middleware permission: users.edit

deactivate() → POST /school/users/{user}/deactivate
  → middleware permission: users.edit
  → interdit de se désactiver soi-même

suspend() → POST /school/users/{user}/suspend
  → middleware: role:school_admin,director

resetPassword() → POST /school/users/{user}/reset-password
  → middleware permission: users.edit
  → retourne { temporary_password: "xxxxx" } (à afficher UNE SEULE FOIS)

permissions() → GET /school/users/{user}/permissions
  → retourne UserPermissionsResource

### InvitationController

index() → GET /school/invitations
  → filtre par status, email
  → UserInvitationResource collection

store() → POST /school/invitations
  → middleware permission: users.invite
  → InviteUserRequest
  → retourne invitation + invitation_link

show() → GET /school/invitations/{invitation}

resend() → POST /school/invitations/{invitation}/resend
  → middleware permission: users.invite
  → vérifie non acceptée

revoke() → POST /school/invitations/{invitation}/revoke
  → middleware permission: users.invite

// ENDPOINT PUBLIC (pas de auth) — pour l'acceptation du lien
accept() → POST /school/invitations/accept
  → AcceptInvitationRequest (token + données user)
  → retourne { user: UserResource, token: "sanctum_token" }

### PermissionController

index() → GET /school/permissions/roles
  → liste tous les rôles avec leurs permissions groupées
  → RolePermissionsResource collection

updateRole() → PUT /school/permissions/roles/{roleName}
  → middleware: role:school_admin
  → interdit de modifier school_admin
  → UpdateRolePermissionsRequest
  → syncPermissions

availablePermissions() → GET /school/permissions/available
  → retourne toutes les permissions disponibles groupées par module
  → utile pour alimenter le formulaire de gestion des permissions

## ROUTES (routes/tenant.php)

Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {

  // Utilisateurs école
  Route::prefix('school')->group(function () {

    // Users CRUD
    Route::get('users', [UserController::class, 'index'])
         ->middleware('can:users.view');
    Route::post('users', [UserController::class, 'store'])
         ->middleware('can:users.create');
    Route::get('users/{user}', [UserController::class, 'show'])
         ->middleware('can:users.view');
    Route::put('users/{user}', [UserController::class, 'update'])
         ->middleware('can:users.edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])
         ->middleware('can:users.delete');

    // Actions utilisateur
    Route::post('users/{user}/activate', [UserController::class, 'activate'])
         ->middleware('can:users.edit');
    Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])
         ->middleware('can:users.edit');
    Route::post('users/{user}/suspend', [UserController::class, 'suspend'])
         ->middleware('role:school_admin,director');
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])
         ->middleware('can:users.edit');
    Route::get('users/{user}/permissions', [UserController::class, 'permissions'])
         ->middleware('can:users.view');

    // Invitations
    Route::get('invitations', [InvitationController::class, 'index'])
         ->middleware('can:users.invite');
    Route::post('invitations', [InvitationController::class, 'store'])
         ->middleware('can:users.invite');
    Route::get('invitations/{invitation}', [InvitationController::class, 'show'])
         ->middleware('can:users.invite');
    Route::post('invitations/{invitation}/resend', [InvitationController::class, 'resend'])
         ->middleware('can:users.invite');
    Route::post('invitations/{invitation}/revoke', [InvitationController::class, 'revoke'])
         ->middleware('can:users.invite');

    // Permissions & Rôles
    Route::get('permissions/roles', [PermissionController::class, 'index'])
         ->middleware('can:users.roles.manage');
    Route::put('permissions/roles/{roleName}', [PermissionController::class, 'updateRole'])
         ->middleware('role:school_admin');
    Route::get('permissions/available', [PermissionController::class, 'availablePermissions'])
         ->middleware('can:users.roles.manage');
  });
});

// ROUTE PUBLIQUE — accepter une invitation (sans auth)
Route::post('school/invitations/accept', [InvitationController::class, 'accept']);

## TESTS HOPPSCOTCH

POST /api/school/users
  { "first_name":"Jean","last_name":"Kouassi","email":"j.kouassi@demo.com",
    "password":"password","password_confirmation":"password","role":"teacher" }
  → 201, UserResource avec rôle "Enseignant"

POST /api/school/invitations
  { "email":"new.staff@gmail.com", "role":"staff" }
  → 201, invitation_link affiché

POST /api/school/invitations/accept
  { "token":"xxx","first_name":"Marie","last_name":"Bah",
    "password":"password","password_confirmation":"password" }
  → 200, user + sanctum token

GET /api/school/users?role=teacher&status=active
  → liste paginée des enseignants actifs

POST /api/school/users/{id}/reset-password
  → { "temporary_password": "K3#mxP9qL2" }

PUT /api/school/permissions/roles/teacher
  { "permissions": ["grades.view","grades.input","attendance.view","attendance.input"] }
  → rôle teacher mis à jour
```

---

## SESSION 3.4 — Frontend : Types + API + Hooks + Store

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui
State : TanStack Query v5, Zustand v4, React Hook Form + Zod
HTTP : Axios (instance configurée dans shared/lib/axios.ts)

Phase 3 Sessions 1-3 terminées (backend complet et testé)

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/users.types.ts

// Rôles et statuts
export type UserRole =
  'school_admin' | 'director' | 'teacher' | 'accountant' | 'staff' | 'student' | 'parent';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

// Constantes UI
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  school_admin: 'Administrateur',
  director: 'Directeur',
  teacher: 'Enseignant',
  accountant: 'Comptable',
  staff: 'Personnel',
  student: 'Élève',
  parent: 'Parent',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  school_admin: 'purple',
  director: 'blue',
  teacher: 'green',
  accountant: 'orange',
  staff: 'gray',
  student: 'cyan',
  parent: 'pink',
};

export const STAFF_ROLES: UserRole[] = ['school_admin','director','teacher','accountant','staff'];

// Interfaces
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: { value: UserRole; label: string; color: string };
  status: { value: UserStatus; label: string; color: string };
  last_login_at: string | null;
  created_at: string;
  can?: {
    edit: boolean;
    delete: boolean;
    manage_role: boolean;
  };
}

export interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role: UserRole;
  phone?: string;
}

export interface UserInvitation {
  id: number;
  email: string;
  role: { value: UserRole; label: string };
  status: { value: InvitationStatus; label: string; color: string };
  invited_by: { id: number; full_name: string };
  is_valid: boolean;
  invitation_link: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InviteUserData {
  email: string;
  role: UserRole;
}

export interface AcceptInvitationData {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface RolePermissions {
  name: string;
  label: string;
  permissions_count: number;
  permissions_by_module: Record<string, string[]>;
}

export interface AvailablePermissions {
  [module: string]: {
    key: string;       // ex: "grades"
    label: string;     // ex: "Notes & Évaluations"
    actions: {
      key: string;     // ex: "view"
      label: string;   // ex: "Voir"
      permission: string; // ex: "grades.view"
    }[];
  };
}

export interface UserPermissions {
  user_id: number;
  role: { value: UserRole; label: string };
  all_permissions: string[];
  permissions_by_module: Record<string, string[]>;
}

### src/modules/school/api/users.api.ts

import { apiClient } from '@/shared/lib/axios';
import type { User, UserFormData, UserInvitation, InviteUserData,
              AcceptInvitationData, RolePermissions, AvailablePermissions,
              UserPermissions } from '../types/users.types';

export const usersApi = {
  // CRUD Utilisateurs
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<User>>('/school/users', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<User>>(`/school/users/${id}`),
  create: (data: UserFormData) =>
    apiClient.post<ApiSuccess<User>>('/school/users', data),
  update: (id: number, data: Partial<UserFormData>) =>
    apiClient.put<ApiSuccess<User>>(`/school/users/${id}`, data),
  delete: (id: number) =>
    apiClient.delete(`/school/users/${id}`),

  // Actions
  activate: (id: number) =>
    apiClient.post<ApiSuccess<User>>(`/school/users/${id}/activate`),
  deactivate: (id: number) =>
    apiClient.post<ApiSuccess<User>>(`/school/users/${id}/deactivate`),
  suspend: (id: number) =>
    apiClient.post<ApiSuccess<User>>(`/school/users/${id}/suspend`),
  resetPassword: (id: number) =>
    apiClient.post<ApiSuccess<{ temporary_password: string }>>(`/school/users/${id}/reset-password`),
  getPermissions: (id: number) =>
    apiClient.get<ApiSuccess<UserPermissions>>(`/school/users/${id}/permissions`),
};

export const invitationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<UserInvitation>>('/school/invitations', { params }),
  invite: (data: InviteUserData) =>
    apiClient.post<ApiSuccess<UserInvitation>>('/school/invitations', data),
  resend: (id: number) =>
    apiClient.post<ApiSuccess<UserInvitation>>(`/school/invitations/${id}/resend`),
  revoke: (id: number) =>
    apiClient.post<ApiSuccess<UserInvitation>>(`/school/invitations/${id}/revoke`),
  accept: (data: AcceptInvitationData) =>
    apiClient.post<ApiSuccess<{ user: User; token: string }>>('/school/invitations/accept', data),
};

export const permissionsApi = {
  getRolesWithPermissions: () =>
    apiClient.get<ApiSuccess<RolePermissions[]>>('/school/permissions/roles'),
  getAvailablePermissions: () =>
    apiClient.get<ApiSuccess<AvailablePermissions>>('/school/permissions/available'),
  updateRolePermissions: (roleName: string, permissions: string[]) =>
    apiClient.put(`/school/permissions/roles/${roleName}`, { permissions }),
};

### src/modules/school/hooks/useUsers.ts

Hooks TanStack Query :

// Utilisateurs
useUsers(filters)         → useQuery key: ['users', filters]
useUser(id)               → useQuery key: ['user', id]
useCreateUser()           → useMutation + invalidate ['users'] + toast succès
useUpdateUser()           → useMutation + invalidate ['users', id]
useDeleteUser()           → useMutation + invalidate ['users'] + confirm dialog
useActivateUser()         → useMutation + invalidate ['user', id]
useDeactivateUser()       → useMutation + invalidate ['user', id]
useSuspendUser()          → useMutation + invalidate ['user', id]
useResetPassword()        → useMutation — retourne le MDP temporaire dans onSuccess
useUserPermissions(id)    → useQuery key: ['user-permissions', id]

// Invitations
useInvitations(filters)   → useQuery key: ['invitations', filters]
useInviteUser()           → useMutation + invalidate ['invitations']
useResendInvitation()     → useMutation + invalidate ['invitations']
useRevokeInvitation()     → useMutation + invalidate ['invitations']

// Permissions
useRolesPermissions()     → useQuery key: ['roles-permissions'], staleTime: 5min
useAvailablePermissions() → useQuery key: ['available-permissions'], staleTime: Infinity
useUpdateRolePermissions()→ useMutation + invalidate ['roles-permissions']

### src/modules/school/store/schoolStore.ts (MISE À JOUR)

Ajouter au store existant :

interface SchoolStoreAdditions {
  // Filtre actif sur la liste des users
  userFilters: {
    role: UserRole | null;
    status: UserStatus | null;
    search: string;
  };
  setUserFilters: (filters: Partial<UserFilters>) => void;
  resetUserFilters: () => void;
}

### src/modules/school/lib/userHelpers.ts

// Utilitaires pour les utilisateurs

export function getUserRoleLabel(role: UserRole): string { ... }
export function getUserRoleColor(role: UserRole): string { ... }
export function getUserStatusColor(status: UserStatus): string { ... }
export function canManageRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  const rules: Record<UserRole, UserRole[]> = {
    school_admin: ['director','teacher','accountant','staff'],
    director: ['teacher','accountant','staff'],
    teacher: [], accountant: [], staff: [], student: [], parent: [],
  };
  return rules[currentUserRole]?.includes(targetRole) ?? false;
}
export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}
export function getInvitationStatusColor(status: InvitationStatus): string { ... }
```

---

## SESSION 3.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui
Types, API, Hooks, Helpers : créés en Session 3.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. UsersPage.tsx — Page principale des utilisateurs

LAYOUT :
- Header : titre "Utilisateurs" + boutons [Inviter un utilisateur] [+ Créer un utilisateur]
- Onglets par rôle : Tous | Admin | Directeurs | Enseignants | Comptables | Personnel
  → Badge avec le count de chaque rôle
- Filtres : search (email/nom), status (Actif/Inactif/Suspendu)
- DataTable avec colonnes :
  * Avatar + Nom complet
  * Email
  * Rôle (badge coloré)
  * Statut (badge coloré)
  * Dernière connexion
  * Actions (menu kebab) : Voir | Modifier | Changer rôle | Réinitialiser MDP |
                           Activer/Désactiver | Suspendre | Supprimer

RÈGLES D'AFFICHAGE :
- Les boutons d'action sont conditionnés par user.can.*
- Un utilisateur ne peut pas se modifier/supprimer lui-même
  (griser ou masquer les actions sur sa propre ligne)
- Afficher un badge "Vous" sur la ligne de l'utilisateur connecté

### 2. UserDetailPage.tsx — Détail d'un utilisateur

Onglets :
  - "Profil" : infos personnelles + avatar upload + téléphone
  - "Sécurité" : réinitialiser le mot de passe, voir la dernière connexion
  - "Permissions" : voir les permissions effectives (lecture seule) — renvoie vers la page Rôles pour modifier

### 3. UserFormModal.tsx — Créer / Modifier un utilisateur

Schéma Zod :
  const userSchema = z.object({
    first_name: z.string().min(2, "Prénom requis"),
    last_name: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(8).optional(),
    password_confirmation: z.string().optional(),
    role: z.enum(['school_admin','director','teacher','accountant','staff']),
    phone: z.string().optional(),
  }).refine(data => !data.password || data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ['password_confirmation'],
  });

Champs :
  1. Prénom / Nom (sur la même ligne)
  2. Email
  3. Mot de passe + Confirmation (masqué/affiché) — optionnel en mode édition
  4. Rôle (Select avec descriptions)
  5. Téléphone (optionnel)

### 4. InviteUserModal.tsx — Inviter par email

FORMULAIRE SIMPLE :
  1. Email
  2. Rôle à assigner (Select)

Après soumission → afficher le lien d'invitation généré dans un bloc copie-rapide :
  ┌─────────────────────────────────────────────────────┐
  │ ✅ Invitation envoyée à john@doe.com                │
  │                                                     │
  │ Lien d'invitation (valable 72h) :                  │
  │ https://demo.enmaschool.com/accept-invitation?     │
  │ token=abc123...                      [📋 Copier]   │
  └─────────────────────────────────────────────────────│

### 5. InvitationsPage.tsx — Suivi des invitations

Tableau :
  Email | Rôle | Statut | Invité par | Expire le | Actions

Filtres : status (Pending/Accepted/Expired/Revoked)

Actions par invitation :
  - Pending → [Renvoyer] [Révoquer] [Copier le lien]
  - Accepted → affichage seul (grisé)
  - Expired → [Renvoyer]
  - Revoked → affichage seul

### 6. AcceptInvitationPage.tsx — Page publique d'acceptation

URL : /accept-invitation?token=xxx
Pas de layout auth (page publique)

Fonctionnement :
  1. Au chargement → vérifier le token (GET /school/invitations?token=xxx)
     - Token invalide/expiré → afficher message d'erreur clair
     - Token valide → afficher le formulaire

  2. Formulaire d'activation :
     - Email (pré-rempli depuis l'invitation, en lecture seule)
     - Prénom, Nom
     - Mot de passe + Confirmation
     - Téléphone (optionnel)

  3. Soumission → POST /school/invitations/accept
     - Succès → stocker le token Sanctum → rediriger vers /dashboard
     - Erreur → afficher le message

### 7. RolesPermissionsPage.tsx — Gestion des permissions par rôle

LAYOUT :
- Un onglet par rôle (Director | Teacher | Accountant | Staff)
  NB: school_admin = toujours ALL → afficher en lecture seule avec badge "Accès complet"
- Pour chaque rôle → une grille de permissions groupées par module :

  ┌──────────────────────────────────────────────────────┐
  │ 📊 Notes & Évaluations                              │
  │  ☑ Voir   ☑ Saisir   ☐ Valider   ☐ Supprimer      │
  ├──────────────────────────────────────────────────────┤
  │ 👥 Élèves                                           │
  │  ☑ Voir   ☑ Créer    ☑ Modifier  ☐ Supprimer       │
  └──────────────────────────────────────────────────────┘

  → Bouton [Sauvegarder] qui envoie le PUT
  → Bouton [Restaurer les valeurs par défaut]
  → Toast confirmation après save

### 8. ResetPasswordModal.tsx — Réinitialisation MDP

Après confirmation → afficher le MDP temporaire UNE SEULE FOIS :

  ┌─────────────────────────────────────────────────────┐
  │ ⚠️ Mot de passe temporaire généré                  │
  │                                                     │
  │  K3#mxP9qL2             [📋 Copier]                │
  │                                                     │
  │ Communiquez ce mot de passe à l'utilisateur.        │
  │ Il ne sera plus visible après fermeture.            │
  │                                [✓ J'ai noté, Fermer]│
  └─────────────────────────────────────────────────────┘

## COMPOSANTS PARTAGÉS À CRÉER

1. UserRoleBadge.tsx
   Props: { role: UserRole }
   → Badge coloré avec libellé selon USER_ROLE_LABELS/COLORS

2. UserStatusBadge.tsx
   Props: { status: UserStatus }
   → Badge avec point coloré (vert/gris/rouge/orange)

3. UserAvatar.tsx
   Props: { user: User; size?: 'sm'|'md'|'lg' }
   → Avatar image ou initiales (first_name[0] + last_name[0])
   → Couleur de fond générée à partir du nom (hashCode)

4. PermissionMatrix.tsx
   Props: { permissions: AvailablePermissions; selected: string[]; onChange: fn; readonly?: boolean }
   → Matrice module × action avec checkboxes

5. InvitationStatusBadge.tsx
   Props: { status: InvitationStatus }

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/users              → UsersPage          (icône: Users)
  /school/users/:id          → UserDetailPage
  /school/invitations        → InvitationsPage    (icône: MailPlus)
  /school/roles-permissions  → RolesPermissionsPage (icône: Shield)

Route publique (sans layout) :
  /accept-invitation         → AcceptInvitationPage

## RÈGLES UX IMPORTANTES

1. Un utilisateur NE PEUT PAS :
   - Se supprimer lui-même
   - Se désactiver lui-même
   - Modifier son propre rôle
   → Griser les boutons concernés sur sa propre ligne

2. Protection du dernier school_admin :
   - Si l'utilisateur est le seul school_admin actif
     → désactiver les boutons Supprimer et Désactiver
     → tooltip: "Impossible — dernier administrateur actif"

3. Confirmation avant actions critiques :
   - Suppression → ConfirmDialog avec nom de l'utilisateur
   - Suspension → ConfirmDialog + champ raison
   - Réinitialisation MDP → ConfirmDialog

4. Feedback temps réel :
   - Toast succès/erreur pour chaque action
   - Refetch automatique de la liste après mutation
   - Indicateur de chargement sur les boutons d'action
```

---

## RÉCAPITULATIF PHASE 3

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 3.1 | Migrations + Seeders | `user_invitations`, `PermissionSeeder` |
| 3.2 | Enums + Models + Services | `UserInvitation`, `UserService`, `InvitationService`, `PermissionService` |
| 3.3 | Controllers + Resources + Routes | `UserController`, `InvitationController`, `PermissionController` |
| 3.4 | Frontend Types + API + Hooks | `users.types.ts`, `users.api.ts`, `useUsers.ts` |
| 3.5 | Frontend Pages + Composants | `UsersPage`, `InvitationsPage`, `RolesPermissionsPage`, `AcceptInvitationPage` |

### Points d'attention critiques

1. **Double synchronisation rôle** — toujours mettre à jour SIMULTANÉMENT :
   - La colonne `users.role` (cache dénormalisé pour perf)
   - Le rôle Spatie (`syncRoles()`)

2. **Protection du dernier school_admin** — valider côté backend ET frontend

3. **Token d'invitation** — endpoint `accept` est PUBLIC (sans auth Sanctum)

4. **MDP temporaire** — ne jamais le logger, l'afficher UNE seule fois, puis oublier

5. **Spatie guard** — s'assurer que les rôles/permissions utilisent le bon guard
   (`web` ou le guard tenant configuré)
