# ENMA SCHOOL — PROMPT : AUDIT COMPLET DU PROJET

> Copie ce prompt dans une nouvelle session Claude avec le fichier `enma-school-context.txt` joint.
> Demande à Claude de générer le fichier d'audit en sortie.

---

## PROMPT À COLLER

```
## RÔLE
Tu es un architecte senior full-stack spécialisé en SaaS EdTech, expert en :
- Laravel 12 / PHP 8.3 / PostgreSQL / architecture multi-tenant
- React 18 / TypeScript 5 / TanStack Query / Zustand
- Conception de bases de données scolaires
- Sécurité API, performance, UX

## MISSION
Effectue un audit complet et critique du projet Enma School tel que décrit
dans le fichier de contexte joint. Ton objectif est d'identifier :

1. Les erreurs (bugs, incohérences, failles de logique métier)
2. Les risques techniques (sécurité, performance, scalabilité)
3. Les améliorations possibles (architecture, UX, conventions)
4. Les oublis ou manques par rapport aux besoins métier décrits

## PÉRIMÈTRE DE L'AUDIT

Analyse les éléments suivants issus du contexte :

### A. Architecture & Multi-tenant
- Stratégie schema-per-tenant (stancl/tenancy v3)
- Séparation schema central / schema tenant
- Résolution tenant par sous-domaine
- Gestion des flags has_maternelle / has_primary / has_college / has_lycee

### B. Modèle de données
- Toutes les tables centrales (plans, tenants, tenant_profiles, domains,
  super_admins, system_modules, plan_modules, subscriptions, tenant_modules,
  activity_logs, support_tickets, ticket_replies, system_settings)
- Toutes les tables tenant (school_settings, academic_years, periods,
  school_levels, classes, subjects, class_subjects, rooms, users)
- Relations, contraintes, types de données, index
- Cohérence des enums et des valeurs métier ivoiriennes

### C. Logique métier scolaire
- Système Level + Série + Section (maternelle, primaire, collège, lycée ivoirien)
- Génération du display_name des classes
- Gestion du is_current pour AcademicYear et Period
- Coefficients effectifs (ClassSubject override)
- Cycle de vie d'une année scolaire (draft → active → closed)
- Règles de promotion des élèves

### D. Sécurité & Auth
- Flux d'authentification (Sanctum tokens)
- Isolation des données entre tenants
- Gestion des rôles et permissions (Spatie)
- Middlewares (EnsureTenantIsActive, CheckRole, CheckModuleAccess)
- Exposition API (endpoints sensibles, validation des inputs)

### E. Performance & Scalabilité
- Stratégie de cache (Redis, SchoolSetting::get())
- Lazy loading vs eager loading (N+1 potentiels)
- Index de base de données manquants
- Queues et jobs asynchrones
- Potentiel de montée en charge (multi-école)

### F. Stack Frontend
- Structure des modules (school, superadmin, shared)
- Gestion du state (Zustand, TanStack Query)
- Conventions TypeScript (typage strict, zéro any)
- Gestion des erreurs API (intercepteurs Axios)
- Expérience utilisateur (formulaires, navigation, feedback)

### G. Cohérence globale
- Conventions de nommage (Classe vs Class, etc.)
- Format de réponse API uniforme (ApiResponse trait)
- Correspondance types TypeScript ↔ réponses Laravel Resources
- Roadmap (phases 3 à 12) : risques ou dépendances manquantes

## FORMAT DE SORTIE ATTENDU

Génère un fichier Markdown structuré ainsi :

---

# ENMA SCHOOL — RAPPORT D'AUDIT
**Date :** [date]
**Version contexte :** Mars 2026
**Périmètre :** Phases 0, 1, 2 (réalisées) + analyse roadmap

---

## RÉSUMÉ EXÉCUTIF
[3-5 lignes de synthèse : état général, niveau de risque, priorités]

**Score global :** [X/10]

| Catégorie | Statut | Niveau de risque |
|-----------|--------|-----------------|
| Architecture multi-tenant | ✅/⚠️/❌ | Faible/Moyen/Élevé |
| Modèle de données | ... | ... |
| Logique métier scolaire | ... | ... |
| Sécurité & Auth | ... | ... |
| Performance | ... | ... |
| Frontend | ... | ... |

---

## 1. ERREURS IDENTIFIÉES 🔴
> Problèmes qui causeront des bugs en production si non corrigés

### 1.1 [Titre de l'erreur]
**Localisation :** [table/fichier/composant concerné]
**Description :** [explication claire du problème]
**Impact :** [ce qui se passe concrètement si non corrigé]
**Correction recommandée :**
```php / sql / typescript
[code corrigé]
```

[Répéter pour chaque erreur trouvée]

---

## 2. RISQUES TECHNIQUES ⚠️
> Problèmes qui n'empêchent pas le fonctionnement aujourd'hui
> mais qui poseront problème en production ou à l'échelle

### 2.1 [Titre du risque]
**Catégorie :** Sécurité / Performance / Scalabilité / Fiabilité
**Description :** ...
**Probabilité :** Faible / Moyenne / Élevée
**Impact si non traité :** ...
**Recommandation :** ...

[Répéter pour chaque risque]

---

## 3. INCOHÉRENCES MÉTIER ⚠️
> Cas où la logique implémentée ne correspond pas aux règles
> du système scolaire ivoirien ou aux besoins décrits

### 3.1 [Titre]
**Règle métier concernée :** ...
**Ce qui est fait :** ...
**Ce qui devrait être fait :** ...
**Correction :** ...

---

## 4. PROPOSITIONS D'AMÉLIORATION 💡
> Suggestions pour améliorer la qualité, maintenabilité,
> performance ou expérience utilisateur — sans corriger d'erreurs

### 4.1 [Titre]
**Catégorie :** Architecture / Performance / UX / DX / Sécurité
**Situation actuelle :** ...
**Amélioration proposée :** ...
**Bénéfice attendu :** ...
**Effort estimé :** Faible / Moyen / Élevé
**Priorité :** P1 (urgent) / P2 (recommandé) / P3 (nice-to-have)

---

## 5. OUBLIS & MANQUES DÉTECTÉS 🔍
> Fonctionnalités ou éléments techniques mentionnés dans le contexte
> mais absents ou insuffisamment détaillés dans l'implémentation

### 5.1 [Titre]
**Référence contexte :** [section du contexte qui en parle]
**Ce qui manque :** ...
**Impact sur les phases suivantes :** ...
**Recommandation :** ...

---

## 6. ANALYSE DES PHASES FUTURES (3 → 12) 🗺️
> Risques et dépendances à anticiper avant de commencer

| Phase | Titre | Dépendances critiques | Risques identifiés | Recommandations |
|-------|-------|----------------------|-------------------|-----------------|
| 3 | Rôles & Utilisateurs | ... | ... | ... |
| 4 | Élèves | ... | ... | ... |
| 5 | Enseignants | ... | ... | ... |
| 6 | Notes | ... | ... | ... |
| 7 | Bulletins | ... | ... | ... |
| 8 | Emploi du temps | ... | ... | ... |
| 9 | Présences | ... | ... | ... |
| 10 | Frais Scolaires | ... | ... | ... |
| 11 | Communication | ... | ... | ... |
| 12 | Rapports | ... | ... | ... |

---

## 7. CHECKLIST AVANT PHASE 3
> Ce qui doit absolument être vérifié/corrigé avant de continuer

- [ ] [Item critique 1]
- [ ] [Item critique 2]
- [ ] ...

---

## 8. RECOMMANDATIONS PRIORITAIRES
> Top 5 des actions les plus importantes à faire immédiatement

1. 🔴 **[Action 1]** — [pourquoi c'est prioritaire]
2. 🔴 **[Action 2]** — ...
3. ⚠️ **[Action 3]** — ...
4. ⚠️ **[Action 4]** — ...
5. 💡 **[Action 5]** — ...

---

## ANNEXE — INDEX DES FICHIERS CONCERNÉS
[Liste des fichiers/tables mentionnés dans l'audit avec leur section de référence]

---

## INSTRUCTIONS SUPPLÉMENTAIRES POUR CLAUDE

- Sois critique et honnête, même si certaines parties semblent bien conçues
- Cite toujours la section exacte du contexte qui t'a permis d'identifier le problème
- Pour les erreurs de code, fournis toujours la correction complète
- Classe les problèmes du plus critique au moins critique dans chaque section
- Si tu n'es pas certain d'une erreur, indique-le clairement avec [À VÉRIFIER]
- Prends en compte les spécificités du contexte ivoirien (système scolaire, XOF, timezone Africa/Abidjan)
- Génère le fichier en une seule fois, complet, sans couper
```
