# ENMA SCHOOL — LISTE DE TESTS COMPLÈTE
## Phases 0 à 6 — Validation de l'implémentation

**Généré le :** 2026-03-19
**Environnement cible :** http://enmaschool.com:8000
**Base de données centrale :** `enma_school` (schema `public`)
**Schema tenant :** `tenant_4a5eba49-563d-4619-b1f2-7478afc6c041`
**Queue :** database (QUEUE_CONNECTION=database)

---

## LÉGENDE

- ✅ Test à faire (non encore exécuté)
- 🔴 Test critique (bloquant si échec)
- ⚠️ Test important (non bloquant mais à surveiller)
- 💡 Test de régression (vérifier après chaque changement)

**Types :** `DB` · `API` · `TINKER` · `FRONTEND` · `SECURITE` · `METIER`

---

## PHASE 0 — Fondations & Auth

### 0.1 Base de données & Migrations

- ✅ 🔴 **[DB-001]** Schema `public` contient toutes les tables centrales
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
  ```
  **Attendu :** activity_logs, cache, domains, failed_jobs, jobs, job_batches,
  migrations, model_has_permissions, model_has_roles, password_reset_tokens,
  permissions, personal_access_tokens, plan_modules, plans, role_has_permissions,
  roles, sessions, subscriptions, super_admins, support_tickets, system_modules,
  system_settings, tenant_modules, tenant_profiles, tenants, ticket_replies, users (27 tables)
  **Si échec :** `php artisan migrate`

- ✅ 🔴 **[DB-002]** Schema tenant contient toutes les tables métier
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041'
  AND table_type = 'BASE TABLE' ORDER BY table_name;
  ```
  **Attendu :** academic_years, class_subjects, classes, enrollments, evaluations,
  grades, invitations, migrations, parents, period_averages, periods,
  personal_access_tokens, rooms, school_levels, school_settings, sessions,
  student_parents, students, subject_averages, subjects, teacher_classes,
  teacher_subjects, teachers, users (+ tables Spatie : model_has_permissions,
  model_has_roles, permissions, role_has_permissions, roles)
  **Si échec :** `php artisan tenants:migrate --tenants=4a5eba49-563d-4619-b1f2-7478afc6c041`

- ✅ 🔴 **[DB-003]** Contrainte UNIQUE sur `teacher_classes` (index partiel WHERE is_active=true)
  ```sql
  SELECT indexname, indexdef FROM pg_indexes
  WHERE tablename = 'teacher_classes'
  AND schemaname = 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041';
  ```
  **Attendu :** index `teacher_classes_unique_active_assignment` avec
  `WHERE (is_active = true)`

- ✅ 🔴 **[DB-004]** Contrainte UNIQUE sur `grades` (evaluation_id, student_id)
  ```sql
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_schema = 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041'
  AND table_name = 'grades' AND constraint_type = 'UNIQUE';
  ```
  **Attendu :** `grades_evaluation_id_student_id_unique`

- ✅ 🔴 **[DB-005]** Contrainte UNIQUE sur `enrollments` (student_id, academic_year_id)
  ```sql
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_schema = 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041'
  AND table_name = 'enrollments' AND constraint_type = 'UNIQUE';
  ```
  **Attendu :** `enrollments_student_id_academic_year_id_unique`

- ✅ ⚠️ **[DB-006]** Colonnes `deleted_at` présentes sur les entités avec soft deletes
  ```sql
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema = 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041'
  AND column_name = 'deleted_at';
  ```
  **Attendu :** classes, evaluations, parents, rooms, school_levels, students,
  subjects, teachers, users

- ✅ ⚠️ **[DB-007]** Colonnes `jsonb` sur `subject_averages.period_averages`
  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema = 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041'
  AND table_name = 'subject_averages' AND column_name = 'period_averages';
  ```
  **Attendu :** `data_type = 'jsonb'`

---

### 0.2 Authentification SuperAdmin

- ✅ 🔴 **[AUTH-001]** Login SuperAdmin valide
  ```http
  POST http://enmaschool.com:8000/api/auth/login
  Content-Type: application/json
  X-Tenant: enmaschool.com

  { "email": "superadmin@enmaschool.com", "password": "password" }
  ```
  **Attendu :** `200`, `{ success: true, data: { token: "...", user: { role: "super_admin" } } }`

- ✅ 🔴 **[AUTH-002]** Login avec mauvais mot de passe
  ```http
  POST http://enmaschool.com:8000/api/auth/login
  { "email": "superadmin@enmaschool.com", "password": "wrongpassword" }
  ```
  **Attendu :** `401`, `{ success: false, message: "..." }`

- ✅ 🔴 **[AUTH-003]** Refresh token
  ```http
  POST http://enmaschool.com:8000/api/auth/refresh
  Authorization: Bearer {token}
  ```
  **Attendu :** `200`, nouveau token retourné

- ✅ ⚠️ **[AUTH-004]** Me — profil de l'utilisateur connecté
  ```http
  GET http://enmaschool.com:8000/api/auth/me
  Authorization: Bearer {token}
  ```
  **Attendu :** `200`, données utilisateur incluant rôles et permissions

- ✅ 🔴 **[AUTH-005]** Logout invalide le token
  ```http
  POST http://enmaschool.com:8000/api/auth/logout
  Authorization: Bearer {token}
  ```
  **Attendu :** `200`
  Puis faire `GET /api/auth/me` avec le même token → **Attendu :** `401`

- ✅ 🔴 **[AUTH-006]** Requête sans token retourne 401
  ```http
  GET http://enmaschool.com:8000/api/school/classes
  (sans Authorization header)
  ```
  **Attendu :** `401`

---

### 0.3 Authentification École (Tenant)

- ✅ 🔴 **[AUTH-007]** Login utilisateur tenant (school_admin)
  ```http
  POST http://demo.enmaschool.com:8000/api/auth/login
  Host: demo.enmaschool.com
  { "email": "admin@demo.test", "password": "password" }
  ```
  **Attendu :** `200`, token valide
  **Note :** Adapter le domaine selon le tenant de test

- ✅ ⚠️ **[AUTH-008]** Vérifier que le token superadmin ne fonctionne pas sur les routes tenant
  Utiliser le token superadmin sur `GET /api/school/classes` (domaine tenant)
  **Attendu :** `401` ou `403`

---

### 0.4 Multi-tenant

- ✅ 🔴 **[MT-001]** La table `tenants` contient au moins 1 enregistrement
  ```sql
  SELECT id, data FROM tenants LIMIT 5;
  ```

- ✅ 🔴 **[MT-002]** La table `domains` est associée au tenant
  ```sql
  SELECT d.domain, t.id as tenant_id FROM domains d JOIN tenants t ON d.tenant_id = t.id;
  ```

- ✅ 🔴 **[MT-003]** Le schema tenant est bien isolé
  ```sql
  SET search_path TO 'tenant_4a5eba49-563d-4619-b1f2-7478afc6c041';
  SELECT COUNT(*) FROM users;
  SET search_path TO public;
  ```
  **Attendu :** Les tables tenant et central ne partagent pas de données

---

## PHASE 1 — Interface SuperAdmin

### 1.1 Gestion des Tenants

- ✅ 🔴 **[SA-001]** Lister les tenants
  ```http
  GET http://enmaschool.com:8000/api/admin/tenants
  Authorization: Bearer {super_admin_token}
  ```
  **Attendu :** `200`, liste paginée avec `meta.total >= 1`

- ✅ ⚠️ **[SA-002]** Créer un nouveau tenant
  ```http
  POST http://enmaschool.com:8000/api/admin/tenants
  {
    "name": "École Test",
    "domain": "test-ecole",
    "email": "contact@test-ecole.com",
    "plan_id": 1
  }
  ```
  **Attendu :** `201`, tenant créé + schema DB créé automatiquement

- ✅ ⚠️ **[SA-003]** Voir le détail d'un tenant avec profil et abonnement
  ```http
  GET http://enmaschool.com:8000/api/admin/tenants/{id}
  ```
  **Attendu :** `200`, inclut `profile`, `subscription`, `domain`

---

### 1.2 Plans & Modules

- ✅ ⚠️ **[SA-004]** Lister les plans
  ```http
  GET http://enmaschool.com:8000/api/admin/plans
  ```
  **Attendu :** `200`, plans avec leurs modules associés

- ✅ ⚠️ **[SA-005]** Lister les modules système
  ```http
  GET http://enmaschool.com:8000/api/admin/modules
  ```
  **Attendu :** `200`, liste des modules

---

### 1.3 SuperAdmin non-auth

- ✅ 🔴 **[SA-006]** Routes SuperAdmin inaccessibles sans token
  ```http
  GET http://enmaschool.com:8000/api/admin/tenants
  (sans token)
  ```
  **Attendu :** `401`

- ✅ 🔴 **[SA-007]** Routes SuperAdmin inaccessibles avec token school_admin
  Utiliser token d'un school_admin sur `/api/admin/tenants`
  **Attendu :** `403`

---

## PHASE 2 — Config École & Structure Académique

### 2.1 School Settings

- ✅ 🔴 **[CONF-001]** Lire les paramètres école
  ```http
  GET http://demo.enmaschool.com:8000/api/school/settings
  Authorization: Bearer {school_admin_token}
  ```
  **Attendu :** `200`, liste des settings clé/valeur

- ✅ ⚠️ **[CONF-002]** Mettre à jour un paramètre
  ```http
  PUT http://demo.enmaschool.com:8000/api/school/settings/passing_average
  { "value": "10.00" }
  ```
  **Attendu :** `200`, valeur mise à jour

- ✅ 💡 **[CONF-003]** Cache SchoolSetting invalidé après modification (Tinker)
  ```php
  // Exécuter dans tinker après un PUT /settings/passing_average
  \Cache::get('school_setting_passing_average') // → null (invalidé)
  \App\Models\Tenant\SchoolSetting::get('passing_average') // → relit la DB
  ```
  **Attendu :** 2ème appel remet en cache la nouvelle valeur

---

### 2.2 Années Scolaires & Périodes

- ✅ 🔴 **[AY-001]** Créer une année scolaire
  ```http
  POST http://demo.enmaschool.com:8000/api/school/academic-years
  {
    "name": "2024-2025",
    "start_date": "2024-09-01",
    "end_date": "2025-06-30",
    "period_type": "trimester",
    "passing_average": 10.00
  }
  ```
  **Attendu :** `201`, année créée

- ✅ 🔴 **[AY-002]** Activer une année scolaire → désactive les autres
  ```http
  POST http://demo.enmaschool.com:8000/api/school/academic-years/{id}/activate
  ```
  ```sql
  SELECT id, name, is_current FROM academic_years;
  ```
  **Attendu :** une seule année avec `is_current = true`

- ✅ 🔴 **[AY-003]** Récupérer les périodes d'une année (trimestres ou semestres)
  ```http
  GET http://demo.enmaschool.com:8000/api/school/academic-years/{id}/periods
  ```
  **Attendu :** `200`, 3 périodes (si trimester) ou 2 (si semester), triées par `order`

- ✅ ⚠️ **[AY-004]** Clôturer une année scolaire
  ```http
  POST http://demo.enmaschool.com:8000/api/school/academic-years/{id}/close
  ```
  **Attendu :** `200`, `is_closed = true`; vérifier que les périodes sont aussi clôturées

---

### 2.3 Niveaux Scolaires

- ✅ 🔴 **[LVL-001]** Lister les niveaux scolaires
  ```http
  GET http://demo.enmaschool.com:8000/api/school/school-levels
  ```
  **Attendu :** `200`, niveaux avec `category`, `requires_serie`, `requires_section`

- ✅ 🔴 **[LVL-002]** Activer/désactiver un niveau
  ```http
  POST http://demo.enmaschool.com:8000/api/school/school-levels/{id}/toggle
  ```
  **Attendu :** `200`, `is_active` inversé

- ✅ ⚠️ **[LVL-003]** Vérifier les valeurs `requires_serie` en base
  ```sql
  SELECT label, short_label, requires_serie, requires_section, category
  FROM school_levels ORDER BY category, label;
  ```
  **Attendu :** 2nde → `requires_serie = false`; 1ère, Tle → `requires_serie = true`

---

### 2.4 Classes — Format display_name (CRITIQUE)

Créer une classe pour chaque cas et vérifier le `display_name` généré :

| Test | Niveau | Serie | Section | display_name attendu |
|------|--------|-------|---------|---------------------|
| ✅ 🔴 [CLS-001] | PS (Maternelle, no_serie) | — | A | `PS A` |
| ✅ 🔴 [CLS-002] | MS (Maternelle, no_serie) | — | B | `MS B` |
| ✅ 🔴 [CLS-003] | GS (Maternelle, no_serie) | — | 1 | `GS 1` |
| ✅ 🔴 [CLS-004] | CP1 (Primaire, no_serie) | — | A | `CP1 A` |
| ✅ 🔴 [CLS-005] | CM2 (Primaire, no_serie) | — | 2 | `CM2 2` |
| ✅ 🔴 [CLS-006] | 6ème (Collège, no_serie) | — | 1 | `6ème 1` |
| ✅ 🔴 [CLS-007] | 3ème (Collège, no_serie) | — | A | `3ème A` |
| ✅ 🔴 [CLS-008] | 2nde (Lycée, no_serie) | — | 1 | `2nde 1` |
| ✅ 🔴 [CLS-009] | 1ère (Lycée, requires_serie) | A | 1 | `1ère A1` |
| ✅ 🔴 [CLS-010] | 1ère (Lycée, requires_serie) | B | 2 | `1ère B2` |
| ✅ 🔴 [CLS-011] | Terminale (Lycée, requires_serie) | C | 1 | `Tle C1` |
| ✅ 🔴 [CLS-012] | Terminale (Lycée, requires_serie) | D | 3 | `Tle D3` |

```http
POST http://demo.enmaschool.com:8000/api/school/classes
{
  "school_level_id": {id_niveau},
  "academic_year_id": {id_annee},
  "section": "A",
  "serie": null,
  "capacity": 35
}
```
**Si échec :** Vérifier `Classe::generateDisplayName()` et `SchoolLevel.requires_serie`

- ✅ 🔴 **[CLS-013]** UNIQUE display_name par academic_year → doublon rejeté
  Tenter de créer 2 classes `6ème 1` sur la même année
  **Attendu :** `422`, erreur de validation unique

- ✅ ⚠️ **[CLS-014]** Lister les élèves d'une classe
  ```http
  GET http://demo.enmaschool.com:8000/api/school/classes/{id}/students
  ```
  **Attendu :** `200`, liste avec `enrollment_id`

- ✅ ⚠️ **[CLS-015]** Lister les matières d'une classe avec class_subjects
  ```http
  GET http://demo.enmaschool.com:8000/api/school/classes/{id}/subjects
  ```
  **Attendu :** `200`, matières avec `coefficient_override`, `hours_per_week`

- ✅ ⚠️ **[CLS-016]** Création en masse (bulk)
  ```http
  POST http://demo.enmaschool.com:8000/api/school/classes/bulk
  { "classes": [{ "school_level_id": 1, "section": "A", ... }, ...] }
  ```
  **Attendu :** `201`, `{ created: N, skipped: M }`

---

### 2.5 Matières

- ✅ 🔴 **[SUB-001]** Créer une matière
  ```http
  POST http://demo.enmaschool.com:8000/api/school/subjects
  {
    "name": "Mathématiques",
    "code": "MATH",
    "coefficient": 4,
    "category": "scientific"
  }
  ```
  **Attendu :** `201`

- ✅ ⚠️ **[SUB-002]** Affecter matières à une classe (class_subjects)
  ```http
  PUT http://demo.enmaschool.com:8000/api/school/classes/{id}/subjects
  { "subjects": [{ "subject_id": 1, "coefficient_override": null, "hours_per_week": 4 }] }
  ```
  **Attendu :** `200`, sync effectuée

- ✅ ⚠️ **[SUB-003]** coefficient_override prioritaire sur coefficient matière
  ```php
  // Tinker
  $cs = \App\Models\Tenant\ClassSubject::with('subject')->first();
  $cs->coefficient_override = 5;
  echo $cs->effective_coefficient; // → 5 (override)
  $cs->coefficient_override = null;
  echo $cs->effective_coefficient; // → valeur de subject.coefficient
  ```

---

### 2.6 Salles

- ✅ ⚠️ **[ROOM-001]** CRUD complet sur les salles
  ```http
  POST /api/school/rooms { "name": "Salle 101", "capacity": 40, "type": "classroom" }
  GET  /api/school/rooms/{id}
  PUT  /api/school/rooms/{id} { "capacity": 45 }
  DELETE /api/school/rooms/{id}
  ```
  **Attendu :** 201, 200, 200, 200 (soft delete)
  Après DELETE : `GET /api/school/rooms/{id}` → `404`

---

## PHASE 3 — Rôles & Utilisateurs École

### 3.1 Gestion des Utilisateurs

- ✅ 🔴 **[USR-001]** Créer un utilisateur school_admin
  ```http
  POST http://demo.enmaschool.com:8000/api/school/users
  {
    "first_name": "Jean", "last_name": "Dupont",
    "email": "jean.dupont@test.com",
    "role": "school_admin",
    "password": "Password123!"
  }
  ```
  **Attendu :** `201`

- ✅ 🔴 **[USR-002]** Créer un utilisateur avec rôle `teacher` → Teacher créé auto (UserObserver)
  ```http
  POST http://demo.enmaschool.com:8000/api/school/users
  { ..., "role": "teacher" }
  ```
  ```php
  // Tinker — vérifier après la création
  \App\Models\Tenant\Teacher::where('user_id', {new_user_id})->exists(); // → true
  \App\Models\Tenant\Teacher::where('user_id', {id})->first()->employee_number;
  // Format attendu : "ENS-2024-0001"
  ```

- ✅ 🔴 **[USR-003]** Lister les utilisateurs (school_admin)
  ```http
  GET http://demo.enmaschool.com:8000/api/school/users
  Authorization: Bearer {school_admin_token}
  ```
  **Attendu :** `200`, liste paginée

- ✅ 🔴 **[USR-004]** Un teacher ne peut pas accéder à la liste des users
  ```http
  GET http://demo.enmaschool.com:8000/api/school/users
  Authorization: Bearer {teacher_token}
  ```
  **Attendu :** `403`

- ✅ ⚠️ **[USR-005]** Désactiver un utilisateur
  ```http
  POST http://demo.enmaschool.com:8000/api/school/users/{id}/deactivate
  ```
  **Attendu :** `200`, `is_active = false`

- ✅ ⚠️ **[USR-006]** Impossible de supprimer le dernier school_admin
  **Attendu :** `422`, message "Impossible de supprimer le dernier administrateur"

---

### 3.2 Système d'Invitation

- ✅ 🔴 **[INV-001]** Inviter un nouvel enseignant
  ```http
  POST http://demo.enmaschool.com:8000/api/school/invitations
  {
    "email": "newteacher@test.com",
    "role": "teacher",
    "first_name": "Marie",
    "last_name": "Martin"
  }
  ```
  **Attendu :** `201`, invitation créée avec token unique

- ✅ ⚠️ **[INV-002]** Renvoi d'invitation
  ```http
  POST http://demo.enmaschool.com:8000/api/school/invitations/{id}/resend
  ```
  **Attendu :** `200`

- ✅ 🔴 **[INV-003]** Accepter l'invitation (route publique)
  ```http
  POST http://demo.enmaschool.com:8000/api/school/invitations/accept
  {
    "token": "{invitation_token}",
    "password": "NewPassword123!",
    "password_confirmation": "NewPassword123!"
  }
  ```
  **Attendu :** `200`, utilisateur créé, Teacher auto-créé si role=teacher

- ✅ ⚠️ **[INV-004]** Révoquer une invitation
  ```http
  POST http://demo.enmaschool.com:8000/api/school/invitations/{id}/revoke
  ```
  **Attendu :** `200`, statut `revoked`
  Puis tenter d'accepter avec le même token → **Attendu :** `422`

---

### 3.3 Permissions & Rôles Spatie

- ✅ 🔴 **[PERM-001]** Lister les rôles et leurs permissions
  ```http
  GET http://demo.enmaschool.com:8000/api/school/permissions/roles
  ```
  **Attendu :** `200`, liste des rôles avec leurs permissions

- ✅ 🔴 **[PERM-002]** Vérifier les permissions Spatie en base
  ```sql
  SELECT r.name as role, p.name as permission
  FROM roles r
  JOIN role_has_permissions rhp ON r.id = rhp.role_id
  JOIN permissions p ON p.id = rhp.permission_id
  WHERE r.name IN ('school_admin', 'teacher')
  ORDER BY r.name, p.name;
  ```
  **Attendu :** teacher a `grades.input` et `grades.view` mais PAS `grades.validate`

- ✅ 🔴 **[PERM-003]** Permissions disponibles
  ```http
  GET http://demo.enmaschool.com:8000/api/school/permissions/available
  ```
  **Attendu :** inclut `grades.view`, `grades.input`, `grades.validate`, `grades.delete`

- ✅ 💡 **[PERM-004]** Cohérence colonne `role` et Spatie
  ```php
  // Tinker
  $user = \App\Models\Tenant\User::first();
  $user->role->value; // → "school_admin"
  $user->hasRole('school_admin'); // → true (Spatie)
  $user->can('users.view'); // → true
  ```

---

### 3.4 Sécurité & Isolation

- ✅ 🔴 **[SEC-001]** Cross-tenant : token d'un tenant ne fonctionne pas sur un autre
  Créer 2 tenants. Se connecter sur tenant A. Faire un GET sur les routes de tenant B.
  **Attendu :** `401` ou `403`

- ✅ 🔴 **[SEC-002]** Teacher ne peut pas accéder aux routes school_admin
  | Route | teacher_token | Attendu |
  |-------|--------------|---------|
  | `GET /api/school/users` | ✓ | `403` |
  | `POST /api/school/users` | ✓ | `403` |
  | `POST /api/school/invitations` | ✓ | `403` |
  | `PUT /api/school/permissions/roles/{r}` | ✓ | `403` |

---

## PHASE 4 — Gestion des Élèves

### 4.1 Dossier Élève

- ✅ 🔴 **[STU-001]** Créer un élève
  ```http
  POST http://demo.enmaschool.com:8000/api/school/students
  {
    "first_name": "Aminata",
    "last_name": "BAMBA",
    "date_of_birth": "2010-05-15",
    "gender": "F"
  }
  ```
  **Attendu :** `201`, `matricule` généré automatiquement

- ✅ 🔴 **[STU-002]** Vérifier le format du matricule auto-généré

  | Catégorie | Code attendu | Exemple |
  |-----------|-------------|---------|
  | Provisoire (avant enrollment) | `GEN` | `2024GEN00001` |
  | Maternelle | `MAT` | `2024MAT00001` |
  | Primaire | `PRI` | `2024PRI00001` |
  | Collège | `COL` | `2024COL00001` |
  | Lycée | `LYC` | `2024LYC00001` |

  Le code catégorie est mis à jour lors du premier enrollment (vérifier via Tinker après inscription).

- ✅ ⚠️ **[STU-003]** Matricule unique dans toute l'école
  ```sql
  SELECT matricule, COUNT(*) FROM students GROUP BY matricule HAVING COUNT(*) > 1;
  ```
  **Attendu :** Aucune ligne (pas de doublon)

- ✅ ⚠️ **[STU-004]** Recherche par matricule, prénom, nom
  ```http
  GET /api/school/students?search=BAMBA
  GET /api/school/students?search=2024COL
  ```
  **Attendu :** Résultats filtrés correctement

- ✅ ⚠️ **[STU-005]** Soft delete élève
  ```http
  DELETE /api/school/students/{id}
  ```
  ```sql
  SELECT id, deleted_at FROM students WHERE id = {id};
  ```
  **Attendu :** `deleted_at` non null; `GET /api/school/students/{id}` → `404`

---

### 4.2 Gestion des Parents

- ✅ ⚠️ **[PAR-001]** Créer un parent et l'associer à un élève
  ```http
  POST /api/school/parents
  {
    "first_name": "Oumar", "last_name": "BAMBA",
    "phone": "+225 07 00 00 00",
    "relationship": "father",
    "student_ids": [{student_id}]
  }
  ```
  **Attendu :** `201`, pivot `student_parents` créé

- ✅ ⚠️ **[PAR-002]** Un parent peut avoir plusieurs enfants
  Associer 2 `student_ids` au même parent
  ```sql
  SELECT student_id FROM student_parents WHERE parent_id = {parent_id};
  ```
  **Attendu :** 2 lignes

---

### 4.3 Inscriptions (Enrollments)

- ✅ 🔴 **[ENR-001]** Inscrire un élève dans une classe
  ```http
  POST /api/school/enrollments
  {
    "student_id": 1,
    "classe_id": 1,
    "academic_year_id": 1
  }
  ```
  **Attendu :** `201`, enrollment créé, `is_active = true`

- ✅ 🔴 **[ENR-002]** Double inscription (même élève, même année) → erreur UNIQUE
  Tenter de réinscrire le même élève la même année dans une autre classe
  **Attendu :** `422`, "L'élève est déjà inscrit pour cette année scolaire"

- ✅ 🔴 **[ENR-003]** Transfert de classe
  ```http
  POST /api/school/enrollments/{id}/transfer
  { "classe_id": {nouvelle_classe_id} }
  ```
  ```sql
  SELECT classe_id, is_active FROM enrollments WHERE student_id = {id};
  ```
  **Attendu :** ancien enrollment → `is_active = false`; nouveau enrollment créé avec `is_active = true`

- ✅ ⚠️ **[ENR-004]** Retrait d'un élève
  ```http
  POST /api/school/enrollments/{id}/withdraw
  ```
  **Attendu :** `200`, `status = withdrawn`

- ✅ ⚠️ **[ENR-005]** Capacité classe respectée
  Inscrire plus d'élèves que la capacité maximum de la classe
  **Attendu :** `422`, "La classe est complète"

---

### 4.4 Import CSV

- ✅ ⚠️ **[CSV-001]** Télécharger le template CSV
  ```http
  GET /api/school/students/import/template
  ```
  **Attendu :** fichier CSV valide avec les colonnes attendues

- ✅ ⚠️ **[CSV-002]** Importer un CSV valide
  ```http
  POST /api/school/students/import
  Content-Type: multipart/form-data
  file: {csv_file}
  classe_id: 1
  ```
  **Attendu :** `200`, `{ imported: N, errors: [] }`

- ✅ ⚠️ **[CSV-003]** Importer un CSV avec erreurs (email invalide, données manquantes)
  **Attendu :** `200`, `{ imported: X, errors: [{ row: Y, message: "..." }] }`

---

## PHASE 5 — Enseignants & Affectations

### 5.1 Profil Enseignant

- ✅ 🔴 **[TCH-001]** Création User role=teacher → Teacher auto-créé (UserObserver)
  ```php
  // Tinker (dans le contexte tenant)
  tenancy()->initialize(\Stancl\Tenancy\Database\Models\Tenant::find('4a5eba49-563d-4619-b1f2-7478afc6c041'));
  $user = \App\Models\Tenant\User::create([
    'first_name' => 'Paul', 'last_name' => 'KONAN',
    'email' => 'pkonan@test.com',
    'password' => bcrypt('password'),
    'role' => 'teacher',
  ]);
  \App\Models\Tenant\Teacher::where('user_id', $user->id)->exists(); // → true
  ```

- ✅ 🔴 **[TCH-002]** Employee number format `ENS-{YEAR}-{NNNN}`
  ```php
  $teacher = \App\Models\Tenant\Teacher::latest()->first();
  preg_match('/^ENS-\d{4}-\d{4}$/', $teacher->employee_number); // → 1
  ```

- ✅ 🔴 **[TCH-003]** UserObserver : changement role teacher → school_admin → Teacher désactivé
  ```php
  $user->update(['role' => 'school_admin']);
  $user->teacherProfile->refresh()->is_active; // → false
  ```

- ✅ ⚠️ **[TCH-004]** Mettre à jour le profil pédagogique
  ```http
  PUT /api/school/teachers/{id}
  {
    "speciality": "Mathématiques",
    "diploma": "Master CAPES",
    "contract_type": "permanent",
    "weekly_hours_max": 18
  }
  ```
  **Attendu :** `200`, données mises à jour

- ✅ ⚠️ **[TCH-005]** Sync matières enseignant
  ```http
  PUT /api/school/teachers/{id}/subjects
  { "subject_ids": [1, 2, 3], "primary_subject_id": 1 }
  ```
  **Attendu :** `200`, matières synchronisées; `teacher_subjects` mis à jour

- ✅ ⚠️ **[TCH-006]** Stats enseignants
  ```http
  GET /api/school/teachers/stats?year_id={id}
  ```
  **Attendu :** `{ total_active, contract_breakdown, without_assignment, overloaded }`

---

### 5.2 Affectations (CRITIQUE)

- ✅ 🔴 **[AFF-001]** Affecter un enseignant à une classe/matière
  ```http
  POST /api/school/assignments
  {
    "teacher_id": 1,
    "class_id": 1,
    "subject_id": 1,
    "academic_year_id": 1,
    "hours_per_week": 4
  }
  ```
  **Attendu :** `201`, assignment créé avec `is_active = true`

- ✅ 🔴 **[AFF-002]** Double affectation même matière/classe/année → conflit
  Affecter un 2ème enseignant sur la même classe/matière/année
  **Attendu :** `409`, "Cette matière est déjà affectée à un enseignant"

- ✅ 🔴 **[AFF-003]** Changement d'enseignant : désaffecter puis affecter
  ```http
  POST /api/school/assignments/{id}/unassign
  ```
  ```sql
  SELECT is_active FROM teacher_classes WHERE id = {id}; -- → false
  ```
  Puis réaffecter un nouvel enseignant → `201`
  ```sql
  -- Les 2 enregistrements existent (historique préservé)
  SELECT id, teacher_id, is_active FROM teacher_classes
  WHERE class_id = 1 AND subject_id = 1 AND academic_year_id = 1;
  ```
  **Attendu :** 2 lignes — l'une `is_active=false`, l'autre `is_active=true`

- ✅ 🔴 **[AFF-004]** Warning surcharge horaire (ne bloque pas)
  Affecter un enseignant qui dépasse `weekly_hours_max`
  **Attendu :** `201` avec `{ data: {...}, warning: "Cet enseignant dépasse sa charge maximale..." }`
  L'affectation EST créée malgré le warning

- ✅ ⚠️ **[AFF-005]** Affectations d'une classe (vue complète)
  ```http
  GET /api/school/classes/{id}/assignments?year_id={year_id}
  ```
  **Attendu :** `{ total_subjects, assigned_subjects, completion_rate, assignments: [...] }`
  Chaque item a `is_assigned`, `teacher`, `subject`, `assignment`

- ✅ ⚠️ **[AFF-006]** Workload d'un enseignant
  ```http
  GET /api/school/teachers/{id}/workload?year_id={id}
  ```
  **Attendu :** `{ total_hours, max_hours, remaining_hours, is_overloaded, assignments }`

---

### 5.3 Cache Charge Horaire

- ✅ 💡 **[AFF-007]** Cache `teacher_{id}_weekly_hours` invalidé après assign/unassign
  ```php
  // Avant affectation
  $before = \Cache::get("teacher_1_weekly_hours");

  // Créer une affectation
  // ...

  // Après affectation
  $after = \Cache::get("teacher_1_weekly_hours"); // → null (invalidé)
  $teacher->weekly_hours; // relit la DB et remet en cache (300s)
  ```

---

## PHASE 6 — Notes & Évaluations

### 6.1 Évaluations

- ✅ 🔴 **[EVAL-001]** Créer une évaluation → grades vides auto-créées
  ```http
  POST /api/school/evaluations
  {
    "class_id": 1, "subject_id": 1, "period_id": 1, "academic_year_id": 1,
    "title": "DC1 Mathématiques",
    "type": "dc",
    "date": "2024-10-15",
    "max_score": 20,
    "coefficient": 1.0
  }
  ```
  **Attendu :** `201`, évaluation créée
  ```sql
  SELECT COUNT(*) FROM grades WHERE evaluation_id = {new_eval_id};
  -- Attendu : = nombre d'élèves inscrits dans la classe (is_active=true)
  ```

- ✅ 🔴 **[EVAL-002]** Tentative de créer une évaluation dans une période clôturée
  Clôturer d'abord la période (`is_closed = true`), puis créer une évaluation
  **Attendu :** `422`, "La période est clôturée — impossible d'ajouter des évaluations"

- ✅ ⚠️ **[EVAL-003]** Lister les évaluations avec filtres
  ```http
  GET /api/school/evaluations?class_id=1&subject_id=1&period_id=1
  ```
  **Attendu :** `200`, liste paginée avec `is_editable` par évaluation

- ✅ ⚠️ **[EVAL-004]** Verrouiller une évaluation
  ```http
  POST /api/school/evaluations/{id}/lock
  ```
  **Attendu :** `200`, `is_locked = true`
  Vérifier ensuite que `is_editable = false`

- ✅ ⚠️ **[EVAL-005]** Modifier une évaluation verrouillée → refusé
  ```http
  PUT /api/school/evaluations/{locked_id}
  { "title": "Nouveau titre" }
  ```
  **Attendu :** `422`, "Cette évaluation ne peut plus être modifiée"

- ✅ ⚠️ **[EVAL-006]** Publier une évaluation
  ```http
  POST /api/school/evaluations/{id}/publish
  ```
  **Attendu :** `200`, `is_published = true`

- ✅ ⚠️ **[EVAL-007]** Soft delete évaluation non verrouillée
  ```http
  DELETE /api/school/evaluations/{id}
  ```
  **Attendu :** `200`; `GET /api/school/evaluations/{id}` → `404`

---

### 6.2 Saisie des Notes (CRITIQUE)

- ✅ 🔴 **[GRD-001]** Récupérer le tableau de saisie (grades sheet)
  ```http
  GET /api/school/grades/sheet?class_id=1&subject_id=1&period_id=1
  ```
  **Attendu :** `200`, structure :
  ```json
  {
    "data": {
      "classe": {...}, "subject": {...}, "period": {...},
      "evaluations": [...],
      "students": [
        { "student": {...}, "enrollment_id": 1, "grades": { "1": {...} }, "period_average": null }
      ],
      "class_stats": { "average": null, "passing_count": 0, ... }
    }
  }
  ```

- ✅ 🔴 **[GRD-002]** Saisir des notes en masse (bulkSave)
  ```http
  POST /api/school/grades/bulk
  {
    "evaluation_id": 1,
    "grades": [
      { "student_id": 1, "score": 15.5, "is_absent": false },
      { "student_id": 2, "score": 8.0, "is_absent": false },
      { "student_id": 3, "score": null, "is_absent": true }
    ]
  }
  ```
  **Attendu :** `200`, `{ saved: 3, errors: [] }`

- ✅ 🔴 **[GRD-003]** Note NULL (absent) ≠ note 0 dans la DB
  ```sql
  SELECT score, is_absent FROM grades
  WHERE evaluation_id = 1 AND student_id = 3; -- l'élève absent
  ```
  **Attendu :** `score = NULL`, `is_absent = true`

- ✅ 🔴 **[GRD-004]** Note qui dépasse le barème → erreur validation
  ```http
  POST /api/school/grades/bulk
  { "evaluation_id": 1, "grades": [{ "student_id": 1, "score": 25 }] }
  -- évaluation sur 20
  ```
  **Attendu :** `422`, "La note 25 dépasse le barème maximum de 20"

- ✅ 🔴 **[GRD-005]** Modifier une note sur évaluation verrouillée → refusé
  ```http
  PUT /api/school/grades/{grade_id}
  { "score": 18 }
  ```
  (sur une évaluation avec `is_locked = true`)
  **Attendu :** `422`, "Cette note ne peut plus être modifiée"

- ✅ 🔴 **[GRD-006]** Modifier une note sur période clôturée → refusé
  Clôturer la période puis tenter `POST /api/school/grades/bulk`
  **Attendu :** `422`, "La période est clôturée"

---

### 6.3 Calcul des Moyennes (CRITIQUE)

- ✅ 🔴 **[MOY-001]** Calcul pondéré correct avec 3 évaluations
  ```
  DC1 (coeff 1) : 15/20 → 15.00
  DC2 (coeff 1) : 12/20 → 12.00
  COMP (coeff 2) : 16/20 → 16.00
  Moyenne = (15×1 + 12×1 + 16×2) / (1+1+2) = 59/4 = 14.75
  ```
  ```php
  // Tinker après bulkSave
  $job = new \App\Jobs\RecalculatePeriodAverageJob($studentId, $subjectId, $periodId, $classeId);
  $job->handle(app(\App\Services\Tenant\AverageCalculatorService::class));
  $avg = \App\Models\Tenant\PeriodAverage::where([
    'student_id' => $studentId, 'subject_id' => $subjectId, 'period_id' => $periodId
  ])->first();
  assert($avg->average == 14.75); // → true
  ```

- ✅ 🔴 **[MOY-002]** Absent (NULL) ne compte PAS dans la moyenne
  ```
  DC1 : ABS (null) → ne compte pas
  DC2 (coeff 1) : 12/20 → 12.00
  COMP (coeff 2) : 16/20 → 16.00
  Moyenne = (12×1 + 16×2) / (1+2) = 44/3 = 14.67
  ```
  **Attendu :** `average = 14.67` (pas 9.83 ce qui serait faux avec null=0)

- ✅ 🔴 **[MOY-003]** Normalisation score sur barème différent de 20
  ```
  DC sur 10 : score 7.5 → score_on_20 = 7.5 × 20/10 = 15.00
  ```
  ```php
  $eval->max_score = 10;
  $grade->score = 7.5;
  assert($grade->score_on_20 == 15.0); // → true
  ```

- ✅ 🔴 **[MOY-004]** Aucune note → average = NULL (pas 0)
  Ne saisir aucune note pour un élève dans une évaluation
  ```sql
  SELECT average FROM period_averages
  WHERE student_id = {id} AND period_id = 1 AND subject_id = 1;
  ```
  **Attendu :** `average = NULL`

- ✅ ⚠️ **[MOY-005]** Recalcul manuel de toutes les moyennes
  ```http
  POST /api/school/grades/recalculate
  { "class_id": 1, "period_id": 1 }
  ```
  **Attendu :** `200`, `{ message: "Recalcul lancé en arrière-plan." }`
  Vérifier que des jobs sont mis en queue :
  ```sql
  SELECT COUNT(*) FROM jobs WHERE queue = 'averages';
  ```

- ✅ ⚠️ **[MOY-006]** Récapitulatif d'un élève
  ```http
  GET /api/school/grades/student/{student_id}?academic_year_id=1
  ```
  **Attendu :** `200`, structure avec `period_averages` et `annual_averages`

---

### 6.4 Rangs & Statistiques Classe

- ✅ ⚠️ **[RANG-001]** Rang calculé dans la classe
  ```php
  $avg = \App\Models\Tenant\PeriodAverage::where([
    'class_id' => 1, 'subject_id' => 1, 'period_id' => 1
  ])->orderBy('average', 'desc')->get();

  // L'élève avec la meilleure note doit avoir rank=1
  assert($avg->first()->rank == 1);
  ```

- ✅ ⚠️ **[RANG-002]** Statistiques de classe dans grades sheet
  ```http
  GET /api/school/grades/sheet?class_id=1&subject_id=1&period_id=1
  ```
  Après saisie de notes :
  **Attendu :** `class_stats.average`, `class_stats.min`, `class_stats.max`,
  `class_stats.passing_rate` calculés correctement

- ✅ ⚠️ **[RANG-003]** Résumé d'une classe par période
  ```http
  GET /api/school/grades/class/{classe_id}?period_id=1&academic_year_id=1
  ```
  **Attendu :** collection de `PeriodAverageResource` par élève/matière

- ✅ ⚠️ **[RANG-004]** Moyenne annuelle calculée depuis period_averages
  ```php
  // Après avoir calculé 3 trimestres avec moyennes 14.0, 12.5, 15.5
  $calc = app(\App\Services\Tenant\AverageCalculatorService::class);
  $sa = $calc->calculateSubjectAnnualAverage($studentId, $subjectId, $yearId);
  // Moyenne = (14.0 + 12.5 + 15.5) / 3 = 14.0
  assert($sa->annual_average == 14.00);
  assert($sa->is_passing == true); // >= 10.0
  ```

---

### 6.5 Queue & Jobs

- ✅ 🔴 **[JOB-001]** RecalculatePeriodAverageJob dispatché après bulkSave
  ```php
  // Dans le tinker, surveiller avant/après
  \DB::table('jobs')->count(); // → avant
  // Appeler bulkSave...
  \DB::table('jobs')->count(); // → après (doit avoir augmenté)
  ```

- ✅ 🔴 **[JOB-002]** Exécuter la queue et vérifier le calcul en DB
  ```bash
  php artisan queue:work --queue=averages --once
  ```
  ```sql
  SELECT average, rank, calculated_at FROM period_averages
  WHERE student_id = 1 AND subject_id = 1 AND period_id = 1;
  ```
  **Attendu :** `average` calculé, `calculated_at` non null

- ✅ ⚠️ **[JOB-003]** Job avec student_id=null recalcule toute la classe
  ```php
  $job = new \App\Jobs\RecalculatePeriodAverageJob(null, 1, 1, 1);
  // Lance des sous-jobs par élève
  \DB::table('jobs')->count(); // augmente de nbElèves × nbMatières
  ```

---

## TESTS TRANSVERSAUX

### T.1 Format de Réponse API

Vérifier que TOUS les endpoints respectent le format standard :

| Format | Exemple | Attendu |
|--------|---------|---------|
| ✅ 🔴 SUCCESS | `GET /api/school/classes/1` | `{ "success": true, "data": {...} }` |
| ✅ 🔴 PAGINATED | `GET /api/school/students` | `{ "success": true, "data": [...], "meta": { "total", "per_page", "current_page" }, "links": {...} }` |
| ✅ 🔴 ERROR 401 | Sans token | `{ "success": false, "message": "Unauthenticated." }` |
| ✅ 🔴 ERROR 403 | Permission insuffisante | `{ "success": false, "message": "..." }` |
| ✅ 🔴 ERROR 404 | Ressource inexistante | `{ "success": false, "message": "..." }` |
| ✅ 🔴 ERROR 422 | Validation échoue | `{ "success": false, "message": "...", "errors": { "field": ["message"] } }` |

---

### T.2 Soft Deletes

Pour chaque entité, vérifier :

| Entité | ✅ | Test DELETE | Vérification SQL |
|--------|---|------------|-----------------|
| Classe | ⚠️ | `DELETE /api/school/classes/{id}` | `deleted_at` non null |
| Matière | ⚠️ | `DELETE /api/school/subjects/{id}` | `deleted_at` non null |
| Salle | ⚠️ | `DELETE /api/school/rooms/{id}` | `deleted_at` non null |
| Élève | ⚠️ | `DELETE /api/school/students/{id}` | `deleted_at` non null |
| Parent | ⚠️ | `DELETE /api/school/parents/{id}` | `deleted_at` non null |
| Évaluation | ⚠️ | `DELETE /api/school/evaluations/{id}` | `deleted_at` non null |

Après chaque DELETE :
- `GET /api/school/{entité}/{id}` → **Attendu :** `404`
- Données toujours en DB (soft delete, pas de suppression physique)

---

### T.3 Pagination

- ✅ ⚠️ **[PAG-001]** Paramètre `per_page` respecté
  ```http
  GET /api/school/students?per_page=5
  ```
  **Attendu :** `meta.per_page = 5`, `data` contient au max 5 entrées

- ✅ ⚠️ **[PAG-002]** Navigation page 2
  ```http
  GET /api/school/students?per_page=5&page=2
  ```
  **Attendu :** `meta.current_page = 2`, données différentes de la page 1

---

### T.4 Performances & N+1

- ✅ 💡 **[PERF-001]** Vérifier eager loading sur les listes
  Activer `config/debugbar.php` ou ajouter `DB::enableQueryLog()` en tinker
  ```php
  \DB::enableQueryLog();
  $students = \App\Models\Tenant\Student::with(['enrollments.classe'])->paginate(20);
  count(\DB::getQueryLog()); // attendu : 3-4 requêtes max, pas 20+
  ```

- ✅ 💡 **[PERF-002]** Cache SchoolSetting : 2ème appel depuis cache
  ```php
  \Cache::flush(); // vider le cache
  \App\Models\Tenant\SchoolSetting::get('passing_average'); // lit la DB
  \App\Models\Tenant\SchoolSetting::get('passing_average'); // lit le cache
  // Vérifier avec les query logs que la 2ème fois = 0 requête SQL
  ```

---

### T.5 Seeders Idempotents

- ✅ 💡 **[SEED-001]** PermissionSeeder exécuté 2 fois ne crée pas de doublons
  ```bash
  php artisan tenants:seed --class=PermissionSeeder --tenants=4a5eba49-...
  php artisan tenants:seed --class=PermissionSeeder --tenants=4a5eba49-...
  ```
  ```sql
  SELECT name, COUNT(*) FROM permissions GROUP BY name HAVING COUNT(*) > 1;
  ```
  **Attendu :** Aucune ligne (pas de doublon)

- ✅ 💡 **[SEED-002]** SchoolLevelSeeder idempotent
  ```bash
  php artisan tenants:seed --class=SchoolLevelSeeder --tenants=4a5eba49-...
  php artisan tenants:seed --class=SchoolLevelSeeder --tenants=4a5eba49-...
  ```
  ```sql
  SELECT label, COUNT(*) FROM school_levels GROUP BY label HAVING COUNT(*) > 1;
  ```
  **Attendu :** Aucune ligne

---

### T.6 Tests Métier — Règles Ivoiriennes

- ✅ 🔴 **[MET-001]** Moyenne de passage configurable
  ```php
  \App\Models\Tenant\SchoolSetting::set('passing_average', '12.00');
  $avg = \App\Models\Tenant\PeriodAverage::first();
  $avg->average = 11.50;
  $avg->is_passing; // → false (11.5 < 12.0)

  \App\Models\Tenant\SchoolSetting::set('passing_average', '10.00');
  $avg->is_passing; // → true (11.5 >= 10.0)
  ```

- ✅ ⚠️ **[MET-002]** Mentions Ivoiriennes correctes
  | Moyenne | Mention attendue |
  |---------|-----------------|
  | 16.00 | Très Bien |
  | 14.00 | Bien |
  | 12.00 | Assez Bien |
  | 10.00 | Passable |
  | 9.99 | Insuffisant |
  (Vérifier côté frontend `getGradeLabel()` et `formatAverage()`)

- ✅ ⚠️ **[MET-003]** Types d'évaluation et leurs coefficients par défaut
  | Type | Coeff par défaut |
  |------|-----------------|
  | dc | 1.0 |
  | dm | 0.5 |
  | composition | 2.0 |
  | exam | 3.0 |
  | interrogation | 0.5 |
  | tp | 1.0 |
  ```php
  \App\Enums\EvaluationType::Composition->defaultCoefficient(); // → 2.0
  \App\Enums\EvaluationType::Exam->defaultCoefficient(); // → 3.0
  ```

---

### T.7 Frontend — UX Critique (Tests Manuels)

- ✅ ⚠️ **[UI-001]** Preview display_name en temps réel dans ClasseFormModal
  1. Ouvrir `http://localhost:5173/school/classes`
  2. Cliquer "Nouvelle classe"
  3. Sélectionner niveau "1ère" (requires_serie=true)
  4. Sélectionner série "A", section "1"
  5. **Vérifier :** le preview affiche `1ère A1` en temps réel sans soumettre le formulaire

- ✅ ⚠️ **[UI-002]** Navigation clavier dans GradesSheetPage
  1. Aller sur `/school/grades/sheet?class_id=1&subject_id=1&period_id=1`
  2. Cliquer sur la première cellule de note
  3. Taper une note et appuyer sur **Tab**
  4. **Vérifier :** focus passe à la cellule suivante (colonne droite)
  5. Appuyer sur **Entrée** → focus descend à la ligne suivante
  6. Appuyer sur **Échap** → annule la modification en cours

- ✅ ⚠️ **[UI-003]** Auto-save avec debounce et AutoSaveIndicator
  1. Saisir une note dans le tableau
  2. **Vérifier :** "Enregistrement..." apparaît après ~200ms de pause
  3. Après 1 seconde d'inactivité : "Enregistré ✓" (vert)
  4. Simuler une erreur réseau : "Erreur ✕" (rouge)

- ✅ ⚠️ **[UI-004]** Bouton ABS dans GradeInput
  1. Cliquer sur le bouton "A" à côté d'une cellule
  2. **Vérifier :** cellule affiche "ABS" (fond gris)
  3. Cliquer "ABS" pour désactiver l'absence
  4. **Vérifier :** retour à l'input numérique

- ✅ ⚠️ **[UI-005]** WorkloadGauge colorée selon le taux
  Sur la page `TeacherDetailPage` :
  - 0-75% → bleu/vert
  - 75-100% → orange
  - >100% → rouge avec AlertTriangle

- ✅ ⚠️ **[UI-006]** EvaluationFormModal — coefficient auto selon le type
  1. Ouvrir le modal de création d'évaluation
  2. Sélectionner type "Composition"
  3. **Vérifier :** coefficient pré-rempli à 2.0
  4. Sélectionner type "Examen"
  5. **Vérifier :** coefficient pré-rempli à 3.0

- ✅ 💡 **[UI-007]** AssignTeacherModal — subject pré-sélectionné depuis ClassAssignmentsTab
  1. Dans la page détail d'une classe, onglet "Affectations"
  2. Cliquer "Assigner" sur une matière non affectée
  3. **Vérifier :** la matière est pré-sélectionnée dans le modal

---

## CHECKLIST FINALE AVANT PHASE 7

| Item | Status |
|------|--------|
| ⬜ Toutes les 4 migrations Phase 6 exécutées sans erreur | |
| ⬜ PermissionSeeder et SchoolLevelSeeder sont idempotents | |
| ⬜ Tous les endpoints retournent `{ success, data, message }` | |
| ⬜ Isolation multi-tenant validée (test cross-tenant) | |
| ⬜ NULL ≠ 0 confirmé dans le calcul de moyennes | |
| ⬜ Normalisation sur 20 correcte (ex: 7.5/10 → 15.0/20) | |
| ⬜ RecalculatePeriodAverageJob dispatché et exécuté avec succès | |
| ⬜ Format display_name correct pour les 12 combinaisons | |
| ⬜ Double sync Spatie + colonne `role` cohérente | |
| ⬜ Soft deletes ne cassent pas les relations | |
| ⬜ Contraintes UNIQUE (enrollments, teacher_classes, grades) respectées | |
| ⬜ UserObserver crée le Teacher auto lors de la création d'un user teacher | |
| ⬜ Cache weekly_hours invalidé après assign/unassign | |
| ⬜ Employee number au format ENS-{YEAR}-{NNNN} | |
| ⬜ Navigation clavier dans GradesSheetPage fonctionnelle | |
| ⬜ AutoSaveIndicator (debounce 1s) fonctionnel | |

---

**Total : ~120 tests documentés** (DB, API, Tinker, Frontend, Métier, Sécurité)
