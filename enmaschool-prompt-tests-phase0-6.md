# ENMA SCHOOL — PROMPT : GÉNÉRATION DE LA LISTE DE TESTS
## Phases 0 à 6 — Vérification complète de l'implémentation

---

> **Comment utiliser ce prompt :**
> Ouvre une nouvelle session Claude, joins le fichier `enma-school-context.txt`
> et colle ce prompt. Claude va générer un fichier `.md` exhaustif avec
> tous les tests à effectuer pour valider les phases 0 à 6.

---

## PROMPT À COLLER

```
## RÔLE
Tu es un ingénieur QA senior spécialisé en applications SaaS EdTech.
Tu maîtrises parfaitement :
- Les tests d'API REST (Hoppscotch / Postman)
- Les tests Laravel (PHPUnit, Feature Tests, Unit Tests)
- Les tests frontend React (manuels et automatisés)
- Les tests de base de données (PostgreSQL, migrations, contraintes)
- Les tests de sécurité (authentification, autorisation, isolation multi-tenant)
- Les tests métier (règles scolaires ivoiriennes, calculs de moyennes)

## MISSION
Analyse en profondeur le fichier de contexte du projet Enma School
et génère une liste de tests EXHAUSTIVE et ORGANISÉE pour vérifier
que les phases 0 à 6 sont parfaitement implémentées.

## CONTEXTE DES PHASES À TESTER

Phase 0 : Fondations & Auth
  → Multi-tenant stancl/tenancy v3, Auth Sanctum, Middlewares, Models de base

Phase 1 : Interface SuperAdmin
  → Gestion tenants, plans, modules, subscriptions, logs, tickets, settings

Phase 2 : Config École & Structure Académique
  → school_settings, academic_years, periods, school_levels, classes,
    subjects, class_subjects, rooms
  → CRITIQUE : gestion Level + Série + Section (format display_name)

Phase 3 : Rôles & Utilisateurs École
  → users, invitations, permissions Spatie, rôles (school_admin, director,
    teacher, accountant, staff)

Phase 4 : Gestion des Élèves
  → students (matricule auto), parents, student_parents, enrollments
  → import CSV, transfert, retrait

Phase 5 : Enseignants & Affectations
  → teachers (profil pédagogique), teacher_subjects, teacher_classes
  → UserObserver (création auto), charge horaire, contrainte UNIQUE

Phase 6 : Notes & Évaluations
  → evaluations, grades, period_averages, subject_averages
  → Calcul de moyennes (NULL ≠ 0), normalisation sur 20,
    verrouillage période, job de calcul asynchrone

## FORMAT DE SORTIE ATTENDU

Génère un fichier Markdown avec cette structure exacte :

---

# ENMA SCHOOL — LISTE DE TESTS COMPLÈTE
## Phases 0 à 6 — Validation de l'implémentation
**Généré le :** [date]
**Environnement cible :** demo.enmaschool.test (local Laragon)
**Base de données :** schema public (central) + schema tenant_demo

---

## LÉGENDE
- ✅ Test à faire (non encore exécuté)
- 🔴 Test critique (bloquant si échec)
- ⚠️ Test important (non bloquant mais à surveiller)
- 💡 Test de régression (vérifier après chaque changement)

---

## PHASE 0 — Fondations & Auth

### 0.1 Base de données & Migrations
**Type :** DB / Schéma

[Liste exhaustive des tests de migration, tables, colonnes, contraintes]

Exemple de format :
- ✅ 🔴 [DB-001] Le schema `public` contient les tables centrales :
  tenants, tenant_profiles, domains, plans, super_admins,
  system_modules, plan_modules, subscriptions, tenant_modules,
  activity_logs, support_tickets, ticket_replies, system_settings
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name;
  ```
  **Résultat attendu :** Les 13 tables sont présentes

- ✅ 🔴 [DB-002] Le schema tenant `tenant_demo` est créé et contient
  toutes les tables tenant attendues
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'tenant_demo' ORDER BY table_name;
  ```

[... continuer pour toutes les vérifications DB de la phase 0]

### 0.2 Authentification SuperAdmin
**Type :** API (Hoppscotch)

- ✅ 🔴 [AUTH-001] Login SuperAdmin
  ```http
  POST http://enmaschool.test/api/auth/login
  { "email": "superadmin@enmaschool.com", "password": "password" }
  ```
  Attendu : 200, token Sanctum retourné

[... continuer pour tous les tests auth]

### 0.3 Authentification École (Tenant)
[...]

### 0.4 Multi-tenant
[...]

### 0.5 Middlewares
[...]

---

## PHASE 1 — Interface SuperAdmin

### 1.1 Gestion des Tenants (Écoles)
[...]

### 1.2 Gestion des Plans
[...]

### 1.3 Gestion des Modules
[...]

### 1.4 Subscriptions
[...]

### 1.5 Activity Logs
[...]

### 1.6 Support Tickets
[...]

### 1.7 System Settings
[...]

---

## PHASE 2 — Config École & Structure Académique

### 2.1 School Settings
[...]

### 2.2 Années Scolaires & Périodes
[...]

### 2.3 Niveaux Scolaires (CRITIQUE)
**Tests critiques de la gestion Level + Série + Section**

[...]

### 2.4 Classes — Format display_name (CRITIQUE)
TESTER TOUS LES FORMATS POSSIBLES :
  - PS A, MS B, GS 1 (Maternelle sans série)
  - CP1 A, CM2 2 (Primaire sans série)
  - 6ème 1, 3ème A (Collège sans série)
  - 2nde 1 (Lycée sans série — la 2nde n'a PAS de série)
  - 1ère A1, 1ère B2 (Lycée AVEC série)
  - Tle C1, Tle D3 (Terminale AVEC série)

[...]

### 2.5 Matières & Class_Subjects
[...]

### 2.6 Salles
[...]

---

## PHASE 3 — Rôles & Utilisateurs École

### 3.1 Gestion des Utilisateurs
[...]

### 3.2 Système d'Invitation
[...]

### 3.3 Permissions & Rôles Spatie
[...]

### 3.4 Sécurité & Isolation
TESTER :
  - Un teacher ne peut pas voir les users d'un autre tenant
  - Un teacher ne peut pas accéder aux routes school_admin
  - La double synchronisation role (colonne users + Spatie) est cohérente
  - Le dernier school_admin ne peut pas être supprimé

[...]

---

## PHASE 4 — Gestion des Élèves

### 4.1 Dossier Élève
[...]

### 4.2 Matricule Auto-généré
TESTER TOUS LES FORMATS :
  - Maternelle → "2024MAT00001"
  - Primaire → "2024PRI00001"
  - Collège → "2024COL00001"
  - Lycée → "2024LYC00001"
  - Séquence continue et sans doublons

[...]

### 4.3 Gestion des Parents
[...]

### 4.4 Inscriptions (Enrollments)
TESTER :
  - UNIQUE(student_id, academic_year_id) — un élève = une classe par an
  - Contrainte capacité maximale
  - Transfert (ancien is_active=false, nouveau créé)
  - Retrait (status=withdrawn)

[...]

### 4.5 Import CSV
[...]

---

## PHASE 5 — Enseignants & Affectations

### 5.1 Profil Enseignant
TESTER :
  - UserObserver : création User role=teacher → Teacher créé auto
  - UserObserver : changement role → Teacher activé/désactivé
  - Employee number auto-généré

[...]

### 5.2 Affectations (CRITIQUE)
TESTER :
  - UNIQUE(class_id, subject_id, academic_year_id) — une matière = un prof par classe par an
  - Tentative de double affectation → 409 Conflict
  - Changement d'enseignant : unassign + assign
  - Warning surcharge (ne bloque pas)
  - Calcul charge horaire (weekly_hours)

[...]

### 5.3 Cache Charge Horaire
[...]

---

## PHASE 6 — Notes & Évaluations

### 6.1 Évaluations
[...]

### 6.2 Saisie des Notes (CRITIQUE)
TESTER :
  - NULL ≠ 0 (absent n'entre pas dans la moyenne)
  - Normalisation sur 20 (score sur barème différent)
  - Grades vides créées automatiquement à la création d'évaluation
  - Verrouillage is_locked → 403 sur modification
  - Période clôturée → 403 sur modification

[...]

### 6.3 Calcul des Moyennes (CRITIQUE)
TESTER AVEC DES DONNÉES PRÉCISES :
  Exemple :
    DC1 (coeff 1) : 15/20 → 15.0
    DC2 (coeff 1) : 12/20 → 12.0
    COMP (coeff 2) : 16/20 → 16.0
    Moyenne attendue = (15×1 + 12×1 + 16×2) / (1+1+2) = 59/4 = 14.75

  Tester avec absents :
    DC1 : ABS (null)
    DC2 : 12/20 → 12.0
    COMP : 16/20 → 16.0
    Moyenne attendue = (12×1 + 16×2) / (1+2) = 44/3 = 14.67
    (DC1 ne compte PAS)

  Tester normalisation :
    DC sur 10 : score 7.5 → score_on_20 = 7.5 × 20/10 = 15.0

[...]

### 6.4 Rangs & Statistiques Classe
[...]

### 6.5 Queue & Jobs
TESTER :
  - RecalculatePeriodAverageJob bien dispatché après bulkSave
  - Job s'exécute correctement : average calculée en DB
  - Vérifier Laravel Horizon (si configuré)

[...]

---

## TESTS TRANSVERSAUX (toutes phases)

### T.1 Sécurité Multi-tenant
TESTER :
  - Un utilisateur de school A ne peut PAS accéder aux données de school B
  - Les tokens Sanctum sont bien isolés par tenant
  - Les schemas PostgreSQL sont bien séparés

### T.2 Soft Deletes
TESTER pour chaque entité avec soft_deletes :
  - DELETE → soft delete (deleted_at rempli, enregistrement toujours en DB)
  - GET après delete → 404
  - Les relations ne retournent pas les soft-deleted records
  Entités : users, students, parents, classes, subjects, rooms,
             teachers, evaluations

### T.3 Pagination
TESTER :
  - Toutes les listes retournent le format paginé attendu :
    { success: true, data: [...], meta: {...}, links: {...} }
  - Le paramètre per_page est respecté
  - La navigation (next, prev) fonctionne

### T.4 Format de Réponse API
TESTER :
  - SUCCESS : { success: true, data: {...}, message: "..." }
  - ERROR   : { success: false, message: "...", errors: {...} }
  - PAGINATED : { success: true, data: [...], meta: {...} }
  - 401 si pas de token
  - 403 si permission insuffisante
  - 404 si ressource introuvable
  - 422 si validation échoue

### T.5 Performances
TESTER :
  - Pas de requête N+1 détectée (Debugbar ou logs Laravel)
  - Cache SchoolSetting::get() fonctionne (2ème appel depuis cache)
  - Cache weekly_hours teacher invalidé après assign/unassign

### T.6 Frontend — UX Critique
TESTER MANUELLEMENT :
  - Preview display_name en temps réel dans ClasseFormModal
  - Navigation clavier dans GradesSheetPage (Tab/Entrée)
  - Sauvegarde auto (debounce) avec AutoSaveIndicator
  - Formulaires wizard (multi-étapes) : navigation et validation par étape
  - Import CSV : preview des 5 premières lignes, rapport d'erreurs
  - Workload gauge colorée selon le taux

---

## CHECKLIST FINALE AVANT PHASE 7

- [ ] Toutes les migrations ont été exécutées sans erreur
- [ ] Les seeders (PermissionSeeder, SchoolLevelSeeder) sont idempotents
- [ ] Tous les endpoints API retournent le bon format de réponse
- [ ] L'isolation multi-tenant est validée (test cross-tenant)
- [ ] Les calculs de moyennes sont corrects (cas NULL, normalisation, coefficients)
- [ ] Le job RecalculatePeriodAverageJob s'exécute via la queue
- [ ] Le format display_name est correct pour TOUS les niveaux
- [ ] La double sync Spatie + colonne role est cohérente
- [ ] Les soft deletes ne cassent pas les relations
- [ ] Les contraintes UNIQUE (enrollments, teacher_classes) sont respectées

---

## INSTRUCTIONS POUR CLAUDE

Pour chaque test, fournis :

1. **Un identifiant unique** : [PHASE-TYPE-NUMÉRO]
   ex: [DB-001], [AUTH-003], [GRADES-012]

2. **Le type** : DB / API / TINKER / FRONTEND / SECURITE / METIER

3. **La criticité** : 🔴 bloquant / ⚠️ important / 💡 régression

4. **La description** du test en français

5. **La commande exacte** à exécuter selon le type :
   - DB → requête SQL
   - API → exemple HTTP (méthode, URL, body, headers)
   - TINKER → code PHP tinker
   - FRONTEND → étapes manuelles numérotées
   - SECURITE → scénario d'attaque à tester

6. **Le résultat attendu** précis (code HTTP, valeur retournée, état DB)

7. **En cas d'échec** : vérification rapide à faire

**Sois EXHAUSTIF.** L'objectif est d'avoir une liste tellement complète
qu'un développeur junior puisse l'exécuter sans connaissance préalable du projet.

**Minimum attendu :** 150 tests répartis sur les 6 phases + transversaux.

**Organisation :** Utilise des tableaux pour les tests répétitifs
(ex: tester tous les formats de display_name en un seul tableau)
plutôt que de répéter le même template 16 fois.

Génère le fichier Markdown complet en une seule réponse.
```
