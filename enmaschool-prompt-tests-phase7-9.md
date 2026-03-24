# ENMA SCHOOL — PROMPT : GÉNÉRATION DE LA LISTE DE TESTS
## Phases 7 à 9 — Validation de l'implémentation

---

> **Comment utiliser ce prompt :**
> Ouvre une nouvelle session Claude, joins le fichier `enma-school-context.txt`
> ainsi que les fichiers de prompts des phases 7, 8 et 9.
> Colle ce prompt. Claude génèrera un fichier `.md` exhaustif avec
> tous les tests à exécuter pour valider les phases 7 à 9.

---

## PROMPT À COLLER

```
## RÔLE
Tu es un ingénieur QA senior spécialisé en applications SaaS EdTech.
Tu maîtrises parfaitement :
- Les tests d'API REST (Hoppscotch)
- Les tests Laravel (PHPUnit, tinker, artisan)
- Les tests frontend React (manuels)
- Les tests de base de données (PostgreSQL, migrations, contraintes)
- Les tests de génération PDF (DomPDF)
- Les tests de queues Laravel (Horizon)
- Les tests de sécurité (autorisation, isolation multi-tenant)
- Les règles métier scolaires ivoiriennes

## MISSION
Analyse en profondeur les phases 7, 8 et 9 du projet Enma School
et génère une liste de tests EXHAUSTIVE, PRÉCISE et EXÉCUTABLE
pour valider que chaque phase est parfaitement implémentée.

---

## CONTEXTE DES PHASES À TESTER

### PHASE 7 — Bulletins Scolaires (PDF)
Tables : report_cards, report_card_appreciations
Fonctionnalités :
  - Initiation des bulletins (draft) par élève ou par classe entière
  - Saisie des appréciations par matière (auto-save debounce 2000ms)
  - Saisie de la décision du conseil de classe (admis/redouble/...)
  - Génération du PDF via DomPDF (template Blade)
  - Publication des bulletins (verrouillage)
  - Téléchargement du PDF (stream)
  - Publication en masse pour toute une classe
  - Workflow 5 étapes : Initier → Appréciations → Générer → Vérifier → Publier
  - Snapshot des données au moment de la génération
  - Mise à jour de StudentDetailPage (onglet Bulletins)

Points critiques à tester :
  - UNIQUE(enrollment_id, period_id, type)
  - Index partiel PostgreSQL pour bulletin annuel (period_id IS NULL)
  - Bulletin publié = verrouillé (403 sur toute modification)
  - collectBulletinData() récupère bien toutes les données (notes, moyennes, rangs)
  - Template Blade DomPDF avec CSS compatible (DejaVu Sans, tables uniquement)
  - GenerateBulletinsJob exécuté en queue
  - Stockage PDF : storage/app/tenant_{slug}/bulletins/{year}/{period}/{matricule}.pdf

### PHASE 8 — Emploi du Temps
Tables : time_slots, timetable_entries, timetable_overrides
Fonctionnalités :
  - TimeSlotSeeder : 45 créneaux (9/jour × 5 jours, horaires ivoiriens)
  - Vue semaine par classe / enseignant / salle
  - Ajout de cours avec détection de conflits (enseignant + salle)
  - Ajout en masse (bulkStore)
  - 4 types d'overrides ponctuels (annulation, remplacement, salle, déplacé)
  - Deux vues frontend : FullCalendar + Grille tabulaire
  - Drag & Drop FullCalendar avec vérification de conflit
  - Navigation semaine (boutons précédent/suivant)
  - Mise à jour ClasseDetailPage (onglet Emploi du temps)
  - Mise à jour TeacherDetailPage (onglet Planning)
  - Module guard : middleware('module:timetable')

Points critiques à tester :
  - UNIQUE(class_id, time_slot_id, academic_year_id)
  - ConflictException 409 avec détails du conflit
  - checkConflicts() retourne les entrées conflictuelles
  - Override date vs jour de semaine du time_slot (cohérence)
  - getWeekView() résout correctement les overrides pour chaque jour
  - is_break = true → interdit d'ajouter un cours
  - Module désactivé → 403 sur toutes les routes

### PHASE 9 — Présences & Absences
Tables : attendances, absence_justifications
Fonctionnalités :
  - Feuille d'appel par cours (via timetable_entry) ou par journée
  - Saisie en masse avec navigation clavier (P/A/R/J)
  - Sauvegarde auto debounce 800ms
  - 4 statuts : present, absent, late, excused
  - Statistiques par élève et par classe (taux de présence)
  - Calendrier mensuel de présence
  - Soumission et validation des justifications d'absence
  - Approbation justification → absences 'absent' → 'excused'
  - UpdateReportCardAbsencesJob : mise à jour bulletins après justification
  - Seuil d'alerte configurable (school_settings)
  - Mise à jour TimetablePage (bouton "Faire l'appel")
  - Mise à jour StudentDetailPage (onglet Présences)
  - Module guard : middleware('module:attendance')

Points critiques à tester :
  - UNIQUE(enrollment_id, timetable_entry_id, date) avec index partiel NULL
  - NULL ≠ 0 : absent (null) ne compte pas → géré dans GradeService
  - Approbation justification → cascade sur les Attendances + report_cards
  - attendance_risk_threshold lu depuis school_settings (pas hardcodé)
  - Date override cohérente avec day_of_week du time_slot

---

## FORMAT DE SORTIE ATTENDU

Génère un fichier Markdown structuré EXACTEMENT ainsi :

---

# ENMA SCHOOL — LISTE DE TESTS COMPLÈTE
## Phases 7, 8 et 9 — Validation de l'implémentation
**Généré le :** [date]
**Environnement :** demo.enmaschool.test (local Laragon)
**Prérequis :** Phases 0 à 6 validées, données de test en base

---

## LÉGENDE
- ✅ Test à exécuter
- 🔴 Critique — bloquant si échec
- ⚠️ Important — non bloquant mais surveiller
- 💡 Régression — vérifier après chaque changement
- **[TYPE]** : DB / API / TINKER / FRONTEND / QUEUE / SECURITE / METIER

---

## PHASE 7 — BULLETINS SCOLAIRES

### 7.1 Base de données & Migrations
**Prérequis :** `php artisan migrate` exécuté sans erreur

[Exemple de format attendu pour chaque test :]

- ✅ 🔴 **[DB-701]** Tables créées avec toutes les colonnes
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'tenant_demo'
    AND table_name = 'report_cards'
  ORDER BY ordinal_position;
  ```
  **Attendu :** 22 colonnes incluant enrollment_id, period_id, type,
  general_average, general_rank, status, pdf_path, council_decision, etc.

- ✅ 🔴 **[DB-702]** Index partiel pour bulletin annuel (period_id IS NULL)
  ```sql
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'report_cards'
    AND schemaname = 'tenant_demo';
  ```
  **Attendu :** Index `report_cards_annual_unique` présent avec condition
  `WHERE period_id IS NULL AND type = 'annual'`

[... continuer pour TOUS les tests DB de la phase 7 ...]

### 7.2 Initiation des bulletins
**Type :** API + TINKER

[Tests pour : initier un bulletin, initier pour toute une classe,
 doublon UNIQUE, bulletin annuel vs période, etc.]

### 7.3 Saisie des appréciations
**Type :** API + FRONTEND

[Tests pour : sauvegarder une appréciation, bulk save, auto-save debounce,
 limite 300 chars, bulletin publié = 403, etc.]

### 7.4 Décision du conseil de classe
**Type :** API + METIER

[Tests pour : toutes les valeurs de council_decision, honor_mention
 seulement si decision='honor', admis/redouble selon la moyenne, etc.]

### 7.5 Génération PDF
**Type :** API + QUEUE + TINKER

[Tests pour : PDF généré et stocké au bon chemin, hash SHA256,
 GenerateBulletinsJob en queue, template Blade avec DejaVu Sans,
 données snapshot correctes (moyennes, rangs, infos école, etc.)]

### 7.6 Publication et téléchargement
**Type :** API + SECURITE

[Tests pour : publié = verrouillé, téléchargement PDF stream,
 Content-Disposition attachment, 404 si PDF absent, etc.]

### 7.7 collectBulletinData() — Intégrité des données
**Type :** TINKER + METIER

[Tests CRITIQUES : vérifier que toutes les données du bulletin sont
 correctes — moyennes depuis period_averages, rangs, infos élève,
 appréciations, décision, info école depuis school_settings, etc.]

### 7.8 Cas limites & Règles métier
**Type :** METIER + API

[Tests pour : bulletin de période vs annuel (colonnes différentes),
 élève sans notes (moyennes null), classe sans main_teacher, etc.]

### 7.9 Frontend — Pages et composants
**Type :** FRONTEND

[Tests manuels : workflow 5 étapes, auto-save appréciations,
 prévisualisation avant génération, BulletinsStats widget,
 StudentReportCardsTab dans StudentDetailPage, etc.]

---

## PHASE 8 — EMPLOI DU TEMPS

### 8.1 Base de données & Migrations
**Type :** DB

[Tests pour : tables créées, UNIQUE(class_id, time_slot_id, academic_year_id),
 TimeSlotSeeder (45 créneaux), index, types enum, etc.]

### 8.2 TimeSlots — Créneaux horaires
**Type :** DB + API + METIER

[Tests pour : 45 créneaux créés (9 × 5 jours), 7 cours + 2 pauses par jour,
 is_break = true sur les récréations, horaires 07h30-17h00,
 UNIQUE(day_of_week, start_time), getWeeklyGrid() groupé par jour, etc.]

### 8.3 Ajout d'entrées — Sans conflit
**Type :** API + TINKER

[Tests pour : ajout simple réussi, bulk add, couleur effective
 (entry.color ?? subject.color), display_title formaté, etc.]

### 8.4 Détection de conflits — Enseignant
**Type :** API + SECURITE + METIER

[Tests CRITIQUES pour : même enseignant sur même créneau → 409,
 ConflictException avec détails, checkConflicts() retourne teacher_conflict,
 school_admin peut forcer, etc.]

### 8.5 Détection de conflits — Salle
**Type :** API + METIER

[Tests pour : même salle sur même créneau → 409 room_conflict,
 salles différentes → pas de conflit, room_id null → pas de conflit salle, etc.]

### 8.6 Créneaux de pause
**Type :** API + METIER

[Tests pour : time_slot.is_break = true → 422 "Ce créneau est une pause",
 checkConflicts avec is_break → rejeté, etc.]

### 8.7 Overrides — Modifications ponctuelles
**Type :** API + METIER

[Tests pour : chaque type d'override (cancellation, substitution, room_change,
 rescheduled), UNIQUE(entry_id, date), date cohérente avec day_of_week,
 getOverrideForDate() retourne le bon override, isActiveOnDate() = false si annulé,
 getEffectiveTeacher() retourne le remplaçant si substitution, etc.]

### 8.8 Vue semaine — Résolution des overrides
**Type :** API + TINKER + METIER

[Tests CRITIQUES : getWeekView() retourne 5 jours, chaque slot a entry + override,
 is_cancelled = true si annulé, is_modified = true si override,
 effective_teacher = substitute si substitution, etc.]

### 8.9 Module guard
**Type :** SECURITE

[Tests pour : module timetable désactivé → 403 sur toutes les routes,
 module activé → accès normal, etc.]

### 8.10 Frontend — FullCalendar & Grille
**Type :** FRONTEND

[Tests manuels : FullCalendar affiche les cours avec couleurs, drag & drop
 vérifie conflit, grille tabulaire avec créneaux de pause en gris,
 navigation semaine (précédent/suivant/aujourd'hui), AddOverrideModal
 avec sélecteur de type, ConflictAlert temps réel dans le formulaire, etc.]

### 8.11 Mises à jour des pages Phase 2 et 5
**Type :** FRONTEND

[Tests pour : ClasseDetailPage onglet "Emploi du temps" → TimetableGridView,
 TeacherDetailPage onglet "Planning" → vue semaine, etc.]

---

## PHASE 9 — PRÉSENCES & ABSENCES

### 9.1 Base de données & Migrations
**Type :** DB

[Tests pour : tables créées, UNIQUE(enrollment_id, timetable_entry_id, date),
 index partiel pour timetable_entry_id IS NULL, colonnes nullables correctes, etc.]

### 9.2 Saisie des présences — Par cours (timetable_entry)
**Type :** API + METIER

[Tests pour : feuille d'appel getSheetForEntry() retourne tous les élèves inscrits,
 status null si pas encore saisi, recordForEntry() avec statuts mixtes (P/A/R/AJ),
 updateOrCreate (pas de doublon), is_recorded = true après saisie, etc.]

### 9.3 Saisie des présences — Par journée entière
**Type :** API + METIER

[Tests pour : timetable_entry_id = NULL, index partiel respecté,
 getForClass() retourne organisation par cours du jour, etc.]

### 9.4 Statuts et calculs
**Type :** TINKER + METIER

[Tests CRITIQUES :
 - present → is_present = true, is_absent = false
 - absent → countsAsAbsent() = true (entre dans le compteur non justifié)
 - late → is_present = true (présent mais en retard)
 - excused → countsAsExcused() = true, countsAsAbsent() = false
 - NULL ≠ 0 dans les calculs de moyenne (Phase 6 : absences non comptées)]

### 9.5 Statistiques — Élève
**Type :** API + TINKER + METIER

[Tests pour : getStudentStats() calcule correctement le taux de présence,
 absences/justifiées correctement séparées, is_at_risk basé sur school_settings
 (pas hardcodé), etc.]

### 9.6 Statistiques — Classe
**Type :** API + METIER

[Tests pour : getClassStats() retourne tous les élèves triés par taux d'absence,
 avg_attendance_rate calculée, students_at_risk compté correctement, etc.]

### 9.7 Calendrier mensuel
**Type :** API + FRONTEND

[Tests pour : classCalendar() retourne 1 entrée par jour, taux null si non saisi,
 couleurs corrects (vert/orange/rouge) selon le taux, week-ends absent, etc.]

### 9.8 Justifications — Soumission
**Type :** API + METIER

[Tests pour : soumission avec et sans document PDF, status=pending après soumission,
 upload document stocké au bon chemin, date_from <= date_to, etc.]

### 9.9 Justifications — Approbation (CRITIQUE)
**Type :** API + TINKER + METIER

[Tests CRITIQUES :
 - Approuver → toutes les attendances 'absent' de la plage → 'excused'
 - Approuver → UpdateReportCardAbsencesJob dispatché
 - report_cards.absences_justified mis à jour après job
 - report_cards.absences_unjustified réduit correspondamment
 - Rejeter → attendances restent 'absent'
 - Doublon UNIQUE(entry_id, date) respecté après update statut]

### 9.10 UpdateReportCardAbsencesJob
**Type :** QUEUE + TINKER

[Tests pour : job dispatché après approbation, job exécuté via queue:work,
 report_cards mis à jour avec les bons compteurs, etc.]

### 9.11 Seuil d'alerte configurable
**Type :** METIER + DB

[Test CRITIQUE :
 - school_settings.attendance_risk_threshold = 75 (configuré à 75%)
 - Un élève à 76% → is_at_risk = false
 - Un élève à 74% → is_at_risk = true
 - Modifier le seuil dans school_settings → invalidation cache → nouveau calcul
 - NE PAS hardcoder 80% dans le code]

### 9.12 Cohérence date / jour de semaine
**Type :** METIER + API

[Tests pour : override sur une date qui ne correspond pas au day_of_week du slot → 422,
 saisie d'une présence sur un créneau du mauvais jour → erreur, etc.]

### 9.13 Module guard
**Type :** SECURITE

[Tests pour : module attendance désactivé → 403, activé → accès normal]

### 9.14 Frontend — Feuille d'appel
**Type :** FRONTEND

[Tests manuels CRITIQUES :
 - Navigation clavier : P → présent, A → absent, R → retard, J → justifié
 - Flèche bas/haut → élève suivant/précédent
 - Tab sur R → focus sur champ "minutes"
 - Bouton [Tous présents] → tous P d'un coup
 - AutoSaveIndicator : idle → saving → saved après debounce 800ms
 - AttendanceSummaryBar mise à jour en temps réel
 - Badge "Appel effectué" après première saisie]

### 9.15 Mises à jour des pages Phase 4, 7 et 8
**Type :** FRONTEND

[Tests pour :
 - StudentDetailPage onglet "Présences" → StudentAttendanceTab avec stats + calendrier
 - ReportCardEditorPage card "Absences" → données chargées depuis attendance stats
 - TimetablePage bouton "📋 Faire l'appel" sur cours du jour → AttendanceSheetPage]

---

## TESTS TRANSVERSAUX (Phases 7-9)

### TX.1 Intégration Phase 6 → Phase 7
**Type :** METIER + TINKER

[Tests CRITIQUES : les moyennes dans les bulletins correspondent EXACTEMENT
 aux period_averages calculés en Phase 6 — tester avec des valeurs précises :
  - DC1 coeff 1 : 15/20 → 15.0
  - DC2 coeff 1 : 12/20 → 12.0
  - COMP coeff 2 : 16/20 → 16.0
  - Moy attendue : (15+12+32)/4 = 14.75
  → bulletin.general_average doit afficher 14.75]

### TX.2 Intégration Phase 9 → Phase 7
**Type :** METIER + TINKER + QUEUE

[Tests CRITIQUES :
 - Après approbation justification → bulletins mis à jour automatiquement
 - absences_justified / absences_unjustified cohérents entre attendance et report_card
 - Tester le workflow complet : saisie absence → soumission justif → approbation
   → bulletin recalculé]

### TX.3 Intégration Phase 8 → Phase 9
**Type :** METIER + FRONTEND

[Tests pour :
 - Bouton "Faire l'appel" dans TimetablePage → ouvre bonne feuille d'appel
 - Feuille d'appel filtrée sur le bon entry_id et la bonne date
 - L'enseignant ne voit QUE ses cours pour "Faire l'appel"]

### TX.4 Sécurité — Accès par rôle
**Type :** SECURITE

Tester que chaque rôle voit CE QU'IL DOIT et PAS PLUS :

| Action | school_admin | director | teacher | accountant | staff |
|--------|-------------|----------|---------|-----------|-------|
| Générer bulletins | ✓ | ✓ | ✗ | ✗ | ✗ |
| Publier bulletins | ✓ | ✓ | ✗ | ✗ | ✗ |
| Télécharger bulletin | ✓ | ✓ | ✓ | ✗ | ✗ |
| Gérer emploi du temps | ✓ | ✓ | ✗ | ✗ | ✗ |
| Voir emploi du temps | ✓ | ✓ | ✓ | ✗ | ✓ |
| Faire l'appel | ✓ | ✓ | ✓ | ✗ | ✗ |
| Valider justifications | ✓ | ✓ | ✗ | ✗ | ✗ |

[Tests pour chaque combinaison rôle/action avec 403 attendu quand interdit]

### TX.5 Isolation multi-tenant
**Type :** SECURITE

[Tests CRITIQUES :
 - Utilisateur de school A ne peut pas accéder aux bulletins de school B
 - PDF de school A non accessible depuis school B
 - time_slots de school A non visibles depuis school B
 - attendances de school A isolées de school B]

### TX.6 Performance — Requêtes N+1
**Type :** TINKER + METIER

[Tests pour : activer Laravel Debugbar ou query log, vérifier que :
 - getForClass() n'a pas de N+1 (eager load students + attendances)
 - collectBulletinData() n'a pas de N+1 (eager load subjects, averages, etc.)
 - getWeekView() n'a pas de N+1 (eager load entries + overrides + teachers + rooms)]

### TX.7 Queue & Jobs
**Type :** QUEUE

[Tests pour tous les jobs des phases 7-9 :
 - GenerateBulletinsJob → PDF généré, status → Generated
 - UpdateReportCardAbsencesJob → bulletins mis à jour
 - Vérifier via : php artisan queue:work --once
 - Vérifier le log : storage/logs/laravel.log
 - Tester l'échec d'un job (simulate error) → retry mechanism]

### TX.8 Soft Deletes & Intégrité des données
**Type :** DB + API

[Tests pour :
 - report_cards : pas de soft_delete → suppression physique seulement si non publié
 - attendances : pas de soft_delete (document officiel)
 - Suppression d'un enrollment → cascade sur attendances + report_cards (caution !)
 - Clôture d'une période → report_cards liés toujours accessibles]

---

## CHECKLIST FINALE AVANT PHASE 10

- [ ] Toutes les migrations des phases 7-9 exécutées sans erreur
- [ ] TimeSlotSeeder : 45 créneaux présents (vérifier via SQL)
- [ ] PDF bulletins générés correctement (police DejaVu Sans, accents OK)
- [ ] Job GenerateBulletinsJob fonctionnel en queue
- [ ] Job UpdateReportCardAbsencesJob fonctionnel en queue
- [ ] Détection de conflits emploi du temps : teacher + room
- [ ] Feuille d'appel : navigation clavier fonctionnelle (P/A/R/J)
- [ ] Approbation justification → cascade sur attendances + bulletins
- [ ] seuil d'alerte lu depuis school_settings (pas hardcodé)
- [ ] Isolation multi-tenant validée pour PDF et attendances
- [ ] Mises à jour pages Phase 2 et 5 (emploi du temps) déployées
- [ ] Mises à jour pages Phase 4 (présences + bulletins) déployées

---

## DONNÉES DE TEST RECOMMANDÉES

Pour les tests des phases 7-9, voici les données minimales à avoir en base :

```
École demo : demo.enmaschool.test
Année scolaire : 2024-2025 (active, period_type: trimestre)
Périodes : 1er Trimestre (01/10/2024 - 31/12/2024), 2ème, 3ème

Classes :
  - 6ème 1 (school_level: 6EME) → 5 élèves inscrits minimum
  - CM1 A (school_level: CM1)  → 5 élèves inscrits minimum

Enseignants :
  - Prof Maths (teacher) → affecté à 6ème 1 / Mathématiques
  - Prof Français (teacher) → affecté à 6ème 1 / Français

Notes Phase 6 (déjà saisies) :
  Élève 1 : Maths 14.5, Français 11.0 → Moy. Gén. ~12.8
  Élève 2 : Maths 8.0, Français 9.5  → Moy. Gén. ~8.7 (< 10 = redouble)

time_slots Phase 8 :
  Lundi 07h30-08h30 → id:1 (Maths, 6ème 1, Prof Maths, Salle A)
  Lundi 08h30-09h30 → id:2 (Français, 6ème 1, Prof Français, Salle A)
```

---

## INSTRUCTIONS POUR CLAUDE

Pour chaque test, fournis IMPÉRATIVEMENT :

1. **Identifiant unique** : [PHASE-TYPE-NUMÉRO]
   ex: [RC-DB-701], [EDT-API-803], [ATT-METIER-912]

2. **Type** + **Criticité** :
   🔴 bloquant / ⚠️ important / 💡 régression

3. **Description** précise en français (1-2 lignes)

4. **Commande exacte** à exécuter :
   - DB → requête SQL complète
   - API → méthode + URL + body + headers complets
   - TINKER → code PHP complet exécutable
   - FRONTEND → étapes numérotées (1, 2, 3...)
   - QUEUE → commandes artisan

5. **Résultat attendu** précis :
   - Code HTTP pour les API (200, 201, 403, 409, 422...)
   - Valeur précise pour TINKER (ex: "→ 14.75")
   - État visuel pour FRONTEND ("badge vert 'Appel effectué'")
   - État DB pour les jobs ("status = 'generated'")

6. **Vérification en cas d'échec** :
   - Fichier/ligne de code à vérifier
   - Requête SQL de diagnostic
   - Log Laravel à consulter

**Sois EXHAUSTIF et PRÉCIS.**
Minimum attendu : **120 tests** répartis équitablement entre les 3 phases.

**Pour les calculs de moyennes (Phase 7) :** toujours tester avec
des valeurs numériques précises et vérifier que le résultat correspond
EXACTEMENT à la formule : SUM(score_on_20 × coeff) / SUM(coeff).

**Pour les conflits emploi du temps (Phase 8) :** tester les 3 types
de conflits (enseignant / salle / classe) avec des scénarios précis
(même créneau, créneau différent, même jour, jours différents).

**Pour les présences (Phase 9) :** tester TOUS les parcours de la
justification (soumission → approbation → cascade sur attendances et bulletins)
avec vérification de chaque table impactée.

Génère le fichier Markdown complet en une seule réponse.
```
