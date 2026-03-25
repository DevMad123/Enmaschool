# ENMA SCHOOL — PROMPTS PHASE 11
## Communication & Messagerie

---

> ## PÉRIMÈTRE DE LA PHASE 11
>
> **Objectif :** Permettre la communication interne entre les membres de l'école
> (messagerie directe, annonces, notifications système) et l'envoi
> de notifications automatiques liées aux événements clés.
>
> **Tables nouvelles :**
> | Table | Description |
> |-------|-------------|
> | `conversations` | Canal de discussion (direct ou groupe) |
> | `conversation_participants` | Membres d'une conversation |
> | `messages` | Messages échangés dans une conversation |
> | `message_reads` | Marquage lu/non-lu par participant |
> | `announcements` | Annonces officielles de l'école (1-to-many) |
> | `announcement_reads` | Marquage lu par utilisateur |
> | `notifications` | Notifications système (absences, paiements, bulletins...) |
>
> **Concepts clés :**
> - La **messagerie** est une communication bidirectionnelle (direct ou groupe)
> - Les **annonces** sont des messages officiels de l'administration
>   vers tout le personnel ou des groupes spécifiques
> - Les **notifications** sont des alertes système automatiques
>   (absence signalée, bulletin publié, paiement en retard...)
> - Le temps réel est géré via **Laravel Reverb** (WebSocket — déjà dans le stack)
> - Les **emails** sont envoyés pour les notifications importantes
>   (invitation utilisateur, bulletin publié, relance paiement)
> - Module protégé par `module:messaging`
>
> **Types de notifications automatiques :**
> | Événement | Destinataires | Canal |
> |-----------|---------------|-------|
> | Bulletin publié | Enseignants de la classe | App |
> | Absence signalée | Admin + staff | App |
> | Justification soumise | Admin + director | App |
> | Paiement en retard | Accountant | App |
> | Invitation utilisateur | Invité | Email |
> | Cours annulé | (futur — parents) | App |
>
> **HORS PÉRIMÈTRE Phase 11 :**
> - SMS | WhatsApp | portail parents → V2
> - Chat élèves/parents → V2
> - Visioconférence → V2
>
> **Dépendances requises :**
> - Phase 3 ✅ (users, rôles, invitations)
> - Phase 7 ✅ (report_cards — bulletin publié → notification)
> - Phase 9 ✅ (attendances — absence → notification)
> - Phase 10 ✅ (payments — paiement en retard → notification)

---

## SESSION 11.1 — Migrations

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12 / PostgreSQL 18
Multi-tenant : stancl/tenancy v3 (schema-per-tenant)
WebSocket : Laravel Reverb (déjà configuré)

Phases terminées :
- Phase 0-10 : toutes les phases précédentes

Tables existantes utiles :
  users(id, first_name, last_name, email, role, status, settings jsonb)
  report_cards(id, enrollment_id, status, published_at, ...)
  attendances(id, enrollment_id, status, date, ...)
  payments(id, student_fee_id, status, ...)
  student_fees(id, status, due_date, ...)
  timetable_overrides(id, type, date, notified_at, ...)

## CETTE SESSION — Phase 11 : Migrations

Toutes les migrations dans database/migrations/tenant/

## GÉNÈRE LES MIGRATIONS (dans l'ordre)

### 1. create_conversations_table

Objectif : canal de discussion entre utilisateurs.
           Peut être direct (2 personnes) ou groupe (N personnes).

Colonnes :
  id (uuid — plus adapté pour les conversations)
  type               (enum: direct/group)
                     direct = entre 2 utilisateurs
                     group  = conversation de groupe
  name               (string, nullable)
                     NULL pour les conversations directes (nom auto-généré)
                     Obligatoire pour les groupes
  description        (text, nullable) — description du groupe
  avatar             (string, nullable) — image du groupe
  created_by         (foreignId → users, nullOnDelete, nullable)
  last_message_at    (timestamp, nullable) — pour le tri des conversations
  last_message_preview (string, nullable, max:200) — aperçu du dernier message
  is_archived        (boolean, default:false)
  timestamps

  Index : type, last_message_at (DESC), created_by

### 2. create_conversation_participants_table

Objectif : membres d'une conversation avec leur rôle et statut.

Colonnes :
  id
  conversation_id    (foreignId uuid → conversations, cascadeOnDelete)
  user_id            (foreignId → users, cascadeOnDelete)
  role               (enum: admin/member, default:'member')
                     admin = peut ajouter/retirer des membres (groupes)
  joined_at          (timestamp) — date d'entrée dans la conversation
  left_at            (timestamp, nullable) — date de départ (si quitté)
  last_read_at       (timestamp, nullable) — dernier message lu
  is_muted           (boolean, default:false) — notifications silencieuses
  timestamps

  UNIQUE(conversation_id, user_id)
  Index : conversation_id, user_id, last_read_at

### 3. create_messages_table

Objectif : messages échangés dans une conversation.

Colonnes :
  id (uuid)
  conversation_id    (foreignId uuid → conversations, cascadeOnDelete)
  sender_id          (foreignId → users, nullOnDelete, nullable)
                     NULL = message système (ex: "Jean a rejoint le groupe")
  body               (text) — contenu du message
  type               (enum: text/file/image/system, default:'text')
  attachment_path    (string, nullable) — fichier joint (PDF, image)
  attachment_name    (string, nullable) — nom original du fichier
  attachment_size    (unsignedInteger, nullable) — taille en bytes
  reply_to_id        (foreignId uuid → messages, nullOnDelete, nullable)
                     pour les réponses à un message précis
  is_edited          (boolean, default:false)
  edited_at          (timestamp, nullable)
  deleted_at         (timestamp, nullable) — soft delete (message supprimé)
  timestamps

  Index : conversation_id, sender_id, created_at (DESC)
  NB : pas de softDeletes() Laravel — géré manuellement via deleted_at
       pour afficher "[Message supprimé]" dans l'UI

### 4. create_message_reads_table

Objectif : tracer quels utilisateurs ont lu quels messages.
           Utilisé pour calculer les messages non lus.

Colonnes :
  id
  message_id         (foreignId uuid → messages, cascadeOnDelete)
  user_id            (foreignId → users, cascadeOnDelete)
  read_at            (timestamp)

  UNIQUE(message_id, user_id)
  Index : message_id, user_id, read_at

  NB : Optimisation — on n'insère PAS un read pour chaque message.
       On utilise conversation_participants.last_read_at pour savoir
       quels messages sont non lus (message.created_at > last_read_at).
       Cette table est pour les "vus par" individuels si besoin.

### 5. create_announcements_table

Objectif : annonces officielles envoyées par l'administration.
           Différent de la messagerie : 1 émetteur → N destinataires,
           pas de réponse possible.

Colonnes :
  id
  title              (string, max:200)
  body               (text) — contenu de l'annonce (peut contenir du HTML simple)
  type               (enum: general/academic/event/alert/reminder)
                     general  = annonce générale
                     academic = information pédagogique
                     event    = événement à venir
                     alert    = alerte urgente
                     reminder = rappel
  priority           (enum: low/normal/high/urgent, default:'normal')
  target_roles       (jsonb) — rôles ciblés
                     ex: ["teacher", "staff"] ou ["all"]
  target_class_ids   (jsonb, nullable) — classes ciblées (si null = toutes)
  attachment_path    (string, nullable)
  publish_at         (timestamp, nullable) — publication programmée
                     NULL = publier immédiatement
  expires_at         (timestamp, nullable) — date d'expiration
  is_published       (boolean, default:false)
  published_at       (timestamp, nullable)
  created_by         (foreignId → users, nullOnDelete, nullable)
  timestamps, softDeletes()

  Index : type, priority, is_published, publish_at, expires_at

### 6. create_announcement_reads_table

Objectif : tracer les lectures d'annonces par utilisateur.

Colonnes :
  id
  announcement_id    (foreignId → announcements, cascadeOnDelete)
  user_id            (foreignId → users, cascadeOnDelete)
  read_at            (timestamp)

  UNIQUE(announcement_id, user_id)
  Index : announcement_id, user_id

### 7. create_notifications_table

Objectif : notifications système générées automatiquement
           par les événements de l'application.

Colonnes :
  id (uuid)
  user_id            (foreignId → users, cascadeOnDelete)
                     destinataire de la notification
  type               (string) — type de notification
                     ex: 'bulletin_published', 'absence_recorded',
                         'payment_overdue', 'justification_submitted',
                         'timetable_change', 'invitation_sent'
  title              (string, max:200)
  body               (text, nullable)
  data               (jsonb, nullable)
                     métadonnées liées à la notification
                     ex: { "report_card_id": 42, "student_name": "KOUASSI Jean" }
  notifiable_type    (string, nullable) — polymorphic
  notifiable_id      (unsignedBigInteger, nullable) — ID de l'entité liée
  action_url         (string, nullable) — URL frontend de l'action
  icon               (string, nullable) — nom icône lucide-react
  color              (string, nullable) — couleur hex
  is_read            (boolean, default:false)
  read_at            (timestamp, nullable)
  sent_via_email     (boolean, default:false)
  email_sent_at      (timestamp, nullable)
  created_at (timestamp — pas de updated_at, notifications immuables)

  NB : const UPDATED_AT = null; dans le Model

  Index : user_id, type, is_read, created_at (DESC), notifiable_type+id

## COMMANDES DE TEST

php artisan migrate --path=database/migrations/tenant
php artisan tinker
  >>> Schema::hasTable('conversations')
  >>> Schema::hasTable('messages')
  >>> Schema::hasTable('announcements')
  >>> Schema::hasTable('notifications')
  >>> Schema::getColumnListing('notifications')
```

---

## SESSION 11.2 — Enums + Models + Services

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12, strict_types=1, Enums PHP 8.1
WebSocket : Laravel Reverb
Mail : Laravel Mail (SMTP / log pour le dev)

Phase 11 Session 1 terminée :
- Migrations : conversations, conversation_participants, messages,
               message_reads, announcements, announcement_reads,
               notifications ✅

## GÉNÈRE LES ENUMS

### app/Enums/ConversationType.php
cases : Direct, Group
méthode : label() → "Direct", "Groupe"

### app/Enums/MessageType.php
cases : Text, File, Image, System
méthode : label(), icon()

### app/Enums/AnnouncementType.php
cases : General, Academic, Event, Alert, Reminder
values: 'general','academic','event','alert','reminder'
méthode : label() → "Général","Pédagogique","Événement","Alerte","Rappel"
méthode : icon() → nom lucide-react
méthode : color() → couleur hex

### app/Enums/AnnouncementPriority.php
cases : Low, Normal, High, Urgent
méthode : label(), color()
  Low → 'gray', Normal → 'blue', High → 'orange', Urgent → 'red'

### app/Enums/NotificationType.php
// Types de notifications système
const BULLETIN_PUBLISHED    = 'bulletin_published';
const ABSENCE_RECORDED      = 'absence_recorded';
const JUSTIFICATION_SUBMITTED = 'justification_submitted';
const JUSTIFICATION_REVIEWED = 'justification_reviewed';
const PAYMENT_OVERDUE       = 'payment_overdue';
const PAYMENT_RECEIVED      = 'payment_received';
const TIMETABLE_CHANGE      = 'timetable_change';
const INVITATION_SENT       = 'invitation_sent';
const ANNOUNCEMENT_PUBLISHED = 'announcement_published';
const GRADE_PUBLISHED       = 'grade_published';

méthode statique : getTitle(string $type, array $data) : string
  → retourne le titre formaté selon le type et les données
  ex: 'bulletin_published' → "Bulletin de {student_name} publié"

méthode statique : getIcon(string $type) : string
  → icône lucide-react par type de notification

méthode statique : getColor(string $type) : string
  → couleur hex par type

méthode statique : getActionUrl(string $type, array $data) : string|null
  → URL frontend de l'action liée
  ex: 'bulletin_published' → "/school/report-cards/{report_card_id}"

## GÉNÈRE LES MODELS

### Conversation.php

$keyType = 'string'; $incrementing = false; // UUID
$fillable : id, type, name, description, avatar, created_by,
            last_message_at, last_message_preview, is_archived

Casts :
  type → ConversationType::class
  last_message_at → 'datetime'
  is_archived → 'boolean'

Relations :
  participants()  → hasMany ConversationParticipant
  users()         → belongsToMany User via conversation_participants
                    withPivot: role, joined_at, left_at, last_read_at, is_muted
  messages()      → hasMany Message → orderBy('created_at', 'desc')
  lastMessage()   → hasOne Message → latest()
  createdBy()     → belongsTo User

Méthodes :
  isParticipant(User $user) : bool
    → $this->participants()->where('user_id', $user->id)
            ->whereNull('left_at')->exists()
  getUnreadCountFor(User $user) : int
    → participant.last_read_at → count messages après cette date
  isDirect() : bool → type === ConversationType::Direct
  isGroup() : bool → type === ConversationType::Group
  getNameFor(User $user) : string
    → si direct : retourner le nom de l'autre participant
    → si groupe : $this->name
  markReadFor(User $user) : void
    → mise à jour last_read_at du participant

Scopes :
  scopeForUser($query, User $user)
    → whereHas('participants', fn($q) => $q->where('user_id', $user->id)
               ->whereNull('left_at'))
    → orderBy('last_message_at', 'desc')
  scopeActive($query) → where('is_archived', false)
  scopeDirect($query) → where('type', 'direct')
  scopeGroup($query) → where('type', 'group')

### ConversationParticipant.php

$table = 'conversation_participants'
$fillable : conversation_id, user_id, role, joined_at, left_at,
            last_read_at, is_muted
Casts : joined_at → datetime, left_at → datetime,
        last_read_at → datetime, is_muted → boolean

Relations :
  conversation() → belongsTo Conversation
  user()         → belongsTo User

### Message.php

$keyType = 'string'; $incrementing = false; // UUID
$fillable : id, conversation_id, sender_id, body, type,
            attachment_path, attachment_name, attachment_size,
            reply_to_id, is_edited, edited_at, deleted_at

Casts : type → MessageType::class, is_edited → boolean,
        edited_at → datetime, deleted_at → datetime

Relations :
  conversation() → belongsTo Conversation
  sender()       → belongsTo User (FK: sender_id, nullable)
  replyTo()      → belongsTo Message (FK: reply_to_id, nullable)
  replies()      → hasMany Message (FK: reply_to_id)

Accessors :
  getIsDeletedAttribute() : bool → !is_null($this->deleted_at)
  getDisplayBodyAttribute() : string
    → si deleted_at → "[Message supprimé]"
    → sinon → $this->body
  getAttachmentUrlAttribute() : string|null

Scopes :
  scopeVisible($query) → (les messages supprimés restent visibles comme "[supprimé]")
  scopeForConversation($query, string $conversationId)

### Announcement.php

$fillable : title, body, type, priority, target_roles, target_class_ids,
            attachment_path, publish_at, expires_at, is_published,
            published_at, created_by

Casts :
  type → AnnouncementType::class
  priority → AnnouncementPriority::class
  target_roles → 'array'
  target_class_ids → 'array'
  publish_at → 'datetime', expires_at → 'datetime', published_at → 'datetime'
  is_published → 'boolean'

Relations :
  createdBy() → belongsTo User
  reads()     → hasMany AnnouncementRead

Méthodes :
  isTargetedTo(User $user) : bool
    → vérifie si l'annonce cible le rôle de l'utilisateur
    → target_roles contains 'all' OR $user->role->value
  isExpired() : bool → expires_at && expires_at < now()
  isScheduled() : bool → publish_at && publish_at > now() && !is_published
  isReadBy(User $user) : bool
    → $this->reads()->where('user_id', $user->id)->exists()
  getReadCountAttribute() : int → $this->reads()->count()

Scopes :
  scopePublished($query) → where('is_published', true)->where(fn($q) =>
    $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
  scopeForUser($query, User $user)
    → published + targeted to user's role
  scopeScheduled($query) → where('publish_at', '>', now())->where('is_published', false)

softDeletes()

### Notification.php (Model tenant — PAS le Model Laravel natif)

$keyType = 'string'; $incrementing = false; // UUID
const UPDATED_AT = null; // notifications immuables

$fillable : id, user_id, type, title, body, data,
            notifiable_type, notifiable_id, action_url,
            icon, color, is_read, read_at,
            sent_via_email, email_sent_at

Casts :
  data → 'array'
  is_read → 'boolean'
  read_at → 'datetime'
  email_sent_at → 'datetime'

Relations :
  user()       → belongsTo User
  notifiable() → morphTo()

Méthodes :
  markAsRead() : void → is_read = true, read_at = now(), save()
  getFormattedData() : array → données formatées pour l'affichage

Scopes :
  scopeForUser($query, int $userId)
  scopeUnread($query) → where('is_read', false)
  scopeRead($query) → where('is_read', true)
  scopeByType($query, string $type)

## GÉNÈRE LES SERVICES

### ConversationService.php

findOrCreateDirect(User $userA, User $userB) : Conversation
  → Cherche une conversation direct existante entre les 2 users
  → Si introuvable → crée + ajoute les 2 participants
  → Garantit l'unicité d'une conversation directe

createGroup(array $data, User $creator) : Conversation
  data : name, description, user_ids[]
  → Crée la conversation de groupe
  → Ajoute le créateur comme admin
  → Ajoute les autres membres comme member
  → Dispatch SendSystemMessage("Conversation créée par {creator.full_name}")

listForUser(User $user, array $filters = []) : LengthAwarePaginator
  → Conversations de l'utilisateur (non quittées)
  → eager load : lastMessage.sender, participants.user
  → Avec unread_count pour chaque conversation
  → Triées par last_message_at DESC

get(string $conversationId, User $user) : Conversation
  → Vérifier que l'user est participant → 403 sinon
  → load : participants.user, lastMessage

addParticipants(Conversation $conv, array $userIds, User $addedBy) : void
  → Vérifie conv.type = group
  → Vérifie addedBy est admin de la conv
  → Ajoute les nouveaux participants
  → Dispatch message système

removeParticipant(Conversation $conv, User $toRemove, User $removedBy) : void
  → left_at = now()
  → Dispatch message système

leaveConversation(Conversation $conv, User $user) : void
  → left_at = now()

archive(Conversation $conv, User $user) : void
  → is_archived = true pour ce participant (via participant.is_muted ou champ dédié)

markAsRead(Conversation $conv, User $user) : void
  → participant.last_read_at = now()

### MessageService.php

getMessages(Conversation $conv, User $user, array $filters) : LengthAwarePaginator
  → Vérifier que l'user est participant
  → Paginate 50, ordre desc (plus récents en premier)
  → eager load : sender, replyTo.sender, reads
  → Marquer comme lu automatiquement

send(Conversation $conv, User $sender, array $data) : Message
  data : body, type, reply_to_id (nullable), attachment (UploadedFile nullable)
  → Vérifier que sender est participant actif (left_at = null)
  → Upload attachment si présent
  → Créer le Message
  → Mettre à jour conv.last_message_at + last_message_preview
  → Broadcast via Reverb : MessageSent event
  → Retourner le Message

edit(Message $message, string $newBody, User $editor) : Message
  → Vérifier message.sender_id = editor.id
  → Vérifier message non supprimé
  → is_edited = true, edited_at = now(), body = newBody
  → Broadcast MessageEdited event

delete(Message $message, User $deleter) : Message
  → Vérifier sender ou admin de la conv
  → deleted_at = now() (soft)
  → body reste mais display_body → "[Message supprimé]"
  → Broadcast MessageDeleted event

sendSystemMessage(Conversation $conv, string $text) : Message
  → sender_id = null, type = system

### AnnouncementService.php

list(User $user, array $filters = []) : LengthAwarePaginator
  → Annonces publiées ciblant le rôle de l'user
  → eager load : createdBy, reads (count)
  → Avec is_read pour cet utilisateur

create(array $data, User $createdBy) : Announcement
  → Si publish_at null ou passé → is_published = true, published_at = now()
     → Dispatch NotifyAnnouncementJob
  → Sinon → scheduled (publish_at dans le futur)

publish(Announcement $announcement) : Announcement
  → is_published = true, published_at = now()
  → Dispatch NotifyAnnouncementJob(announcement_id)

update(Announcement $announcement, array $data) : Announcement
  → Interdit si is_published (sauf correction mineure avec permission)

delete(Announcement $announcement) : void → soft delete

markRead(Announcement $announcement, User $user) : void
  → AnnouncementRead::firstOrCreate([...])

markAllRead(User $user) : int
  → Marque toutes les annonces non lues de l'user comme lues
  → Retourne le nombre marqué

### NotificationService.php

notify(int $userId, string $type, array $data = [], ?Model $notifiable = null) : Notification
  → Crée la notification dans la table
  → Broadcast via Reverb : NotificationReceived event (temps réel)
  → Si notification importante (bulletin, paiement...) → dispatch SendNotificationEmailJob

notifyMany(array $userIds, string $type, array $data, ?Model $notifiable = null) : void
  → Notify en bulk (insert batch)
  → Broadcast pour chaque user

notifyByRole(string $role, string $type, array $data) : void
  → Récupère tous les users actifs du rôle
  → notifyMany()

markRead(Notification $notification, User $user) : void
  → Vérifier user = notification.user_id
  → markAsRead()

markAllRead(User $user) : int
  → where user_id + is_read = false → update is_read = true, read_at = now()
  → Retourne le nombre marqué

getUnreadCount(User $user) : int
  → Count notifications non lues
  → Mis en cache : Cache::remember("notif_unread_{userId}", 60, ...)
  → Cache invalidé à chaque nouvelle notification

getForUser(User $user, array $filters = []) : LengthAwarePaginator
  → Toutes les notifications de l'user (paginé, 20/page)
  → Tri : non lues en premier, puis par date DESC

// ── Notifications automatiques (appelées depuis les autres services) ──

onBulletinPublished(ReportCard $rc) : void
  → Notifier l'enseignant principal de la classe
  → type: NotificationType::BULLETIN_PUBLISHED
  → data: { report_card_id, student_name, classe_name, period_name }

onAbsenceRecorded(Attendance $attendance) : void
  → Si status = absent → notifier school_admin + director + staff
  → type: NotificationType::ABSENCE_RECORDED
  → data: { student_name, classe_name, date, subject_name }

onJustificationSubmitted(AbsenceJustification $justif) : void
  → Notifier school_admin + director
  → type: NotificationType::JUSTIFICATION_SUBMITTED

onJustificationReviewed(AbsenceJustification $justif) : void
  → Notifier le staff qui a soumis la justification
  → type: NotificationType::JUSTIFICATION_REVIEWED
  → data: { student_name, status (approved/rejected), review_note }

onPaymentOverdue(StudentFee $fee) : void
  → Notifier accountant + director
  → type: NotificationType::PAYMENT_OVERDUE
  → data: { student_name, amount_remaining_formatted, fee_type_name }

onTimetableChange(TimetableOverride $override) : void
  → Notifier l'enseignant concerné
  → type: NotificationType::TIMETABLE_CHANGE
  → data: { type_label, date, subject_name, classe_name, reason }

## EVENTS & LISTENERS (Laravel Reverb)

### Events (Broadcasting)

MessageSent.php
  → implements ShouldBroadcast
  → Channel : PrivateChannel("conversation.{conversationId}")
  → Data : MessageResource (avec sender)

MessageEdited.php
  → PrivateChannel("conversation.{conversationId}")

MessageDeleted.php
  → PrivateChannel("conversation.{conversationId}")

NotificationReceived.php
  → implements ShouldBroadcast
  → Channel : PrivateChannel("user.{userId}.notifications")
  → Data : NotificationResource

AnnouncementPublished.php
  → Channel : Channel("announcements.{tenantId}")
               (public — tous les users connectés du tenant)
  → Data : AnnouncementResource (sans body complet)

### Listeners

SendNotificationEmailListener.php
  → Écoute NotificationReceived pour certains types
  → Si type in [bulletin_published, payment_overdue, justification_reviewed]
  → dispatch SendNotificationEmailJob

## JOBS

### SendNotificationEmailJob.php
Queue : 'emails'
Payload : notification_id

handle() :
  → Charger la Notification avec son user
  → Selon notification.type → envoyer le bon mail :
    bulletin_published → BulletinPublishedMail (Phase 7)
    payment_overdue → PaymentOverdueMail
    justification_reviewed → JustificationReviewedMail
    invitation_sent → InvitationMail (Phase 3 — déjà partiellement fait)
  → notification.sent_via_email = true, email_sent_at = now()

### NotifyAnnouncementJob.php
Queue : 'notifications'
Payload : announcement_id

handle() :
  → Charger l'annonce avec les rôles ciblés
  → Récupérer tous les users actifs des rôles ciblés
  → notifyService->notifyMany(userIds, ANNOUNCEMENT_PUBLISHED, [...])
  → Broadcast AnnouncementPublished event

### CheckOverduePaymentsJob.php (schedule)
Queue : 'scheduled'
Programmé : chaque jour à 8h00 via app/Console/Kernel.php

handle() :
  → Récupérer tous les student_fees où :
    status IN [pending, partial] AND due_date < today
  → Pour chaque fee → mettre à jour status = overdue
  → onPaymentOverdue() → notification à l'accountant

## MAILS (resources/views/emails/)

### BulletinPublishedMail.php
Sujet : "Bulletin de {student_name} disponible — {periode}"
Corps : Nom élève, classe, période, lien pour consulter le bulletin

### PaymentOverdueMail.php
Sujet : "Paiement en retard — {student_name}"
Corps : Montant restant, type de frais, lien vers dossier paiement

### InvitationMail.php (compléter Phase 3)
Sujet : "Invitation à rejoindre {school_name}"
Corps : Lien d'invitation, rôle assigné, expiration 72h

## COMMANDES DE TEST (tinker)

$notifService = app(App\Services\NotificationService::class);

// Créer une notification
$notif = $notifService->notify(
  userId: 1,
  type: App\Enums\NotificationType::BULLETIN_PUBLISHED,
  data: ['student_name' => 'KOUASSI Jean', 'report_card_id' => 1],
);
// → Notification créée, broadcast Reverb, unread_count cache invalidé

// Marquer tout comme lu
$count = $notifService->markAllRead(auth()->user());
// → X notifications marquées lues

// Annonce
$annoService = app(App\Services\AnnouncementService::class);
$annonce = $annoService->create([
  'title' => 'Réunion pédagogique',
  'body' => 'Une réunion aura lieu le vendredi 24 janvier.',
  'type' => 'event',
  'priority' => 'high',
  'target_roles' => ['teacher', 'staff'],
], $user);
// → Annonce publiée, notifications envoyées à tous les teachers + staff

// Conversation directe
$convService = app(App\Services\ConversationService::class);
$conv = $convService->findOrCreateDirect($user1, $user2);

// Envoyer un message
$msgService = app(App\Services\MessageService::class);
$message = $msgService->send($conv, $user1, [
  'body' => 'Bonjour, avez-vous vu les notes du 6ème 1 ?',
  'type' => 'text',
]);
// → Message créé, broadcast via Reverb sur "conversation.{id}"
```

---

## SESSION 11.3 — Controllers + Resources + Routes

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : PHP 8.3 / Laravel 12
Conventions : strict_types=1, Trait ApiResponse, Form Requests, Resources

Phase 11 Sessions 1 & 2 terminées ✅

## GÉNÈRE LES API RESOURCES

### ConversationResource.php
{
  id,
  type: { value, label },
  name: string,               // nom de la conv pour l'user courant
  avatar: string | null,
  is_archived: bool,
  last_message_at: string | null,
  last_message_preview: string | null,
  unread_count: int,
  participants_count: int,
  participants: [             // max 5 pour les groupes (éviter surcharge)
    { id, full_name, avatar_url, role: { value, label } }
  ],
  last_message: MessageResource | null (whenLoaded),
  created_at,
}

### MessageResource.php
{
  id,
  body: string,              // display_body (["Message supprimé"] si deleted)
  type: { value, label },
  is_edited: bool,
  is_deleted: bool,
  edited_at: string | null,
  created_at,
  attachment: {
    path: string | null,
    name: string | null,
    size: int | null,
    url: string | null,
  } | null,
  reply_to: {
    id, body, sender: { id, full_name }
  } | null (whenLoaded),
  sender: {
    id, full_name, avatar_url,
    role: { value, label }
  } | null,                  // null = message système
  is_mine: bool,             // request()->user()->id === sender_id
  read_by_count: int,        // nombre de participants qui ont lu
}

### AnnouncementResource.php
{
  id, title, body,
  type: { value, label, icon, color },
  priority: { value, label, color },
  target_roles: string[],
  is_published: bool,
  is_expired: bool,
  is_scheduled: bool,
  publish_at: string | null,
  expires_at: string | null,
  published_at: string | null,
  attachment_url: string | null,
  is_read: bool,             // si l'user courant l'a lue
  read_count: int,
  created_by: { id, full_name } (whenLoaded),
  created_at,
}

### NotificationResource.php
{
  id,
  type: string,
  title: string,
  body: string | null,
  data: array | null,
  action_url: string | null,
  icon: string | null,
  color: string | null,
  is_read: bool,
  read_at: string | null,
  created_at,
}

### UnreadCountsResource.php
{
  messages: int,        // messages non lus total
  notifications: int,   // notifications non lues
  announcements: int,   // annonces non lues
  total: int,           // somme des 3
}

## GÉNÈRE LES FORM REQUESTS

### StoreConversationRequest
  type         : required, in:'direct','group'
  name         : required_if:type,group, string, max:100
  description  : nullable, string, max:300
  user_ids     : required, array
  user_ids.*   : exists:users,id, different from auth user
  Validation : si type=direct → user_ids doit contenir exactement 1 id

### SendMessageRequest
  body         : required_without:attachment, string, max:5000
  type         : nullable, in: MessageType cases, default:'text'
  reply_to_id  : nullable, exists:messages,id
  attachment   : nullable, file, max:10240, mimes:pdf,jpg,jpeg,png,docx,xlsx

### StoreAnnouncementRequest
  title        : required, string, max:200
  body         : required, string
  type         : required, in: AnnouncementType cases
  priority     : nullable, in: AnnouncementPriority cases, default:'normal'
  target_roles : required, array, min:1
  target_roles.*: in:'all','school_admin','director','teacher','accountant','staff'
  publish_at   : nullable, date
  expires_at   : nullable, date, after:publish_at
  attachment   : nullable, file, max:10240

## GÉNÈRE LES CONTROLLERS

### ConversationController

index() → GET /school/conversations
  → permission: messaging.view
  → conversations de l'user courant, avec unread_count
  → ConversationResource paginé (20/page, triées par last_message_at)

store() → POST /school/conversations
  → permission: messaging.send
  → StoreConversationRequest
  → findOrCreateDirect ou createGroup selon le type

show() → GET /school/conversations/{conversation}
  → Vérifier que l'user est participant
  → ConversationResource avec participants

messages() → GET /school/conversations/{conversation}/messages
  → Vérifier participant
  → MessageResource paginé (50/page, ordre desc)
  → Marquer conv comme lue après récupération

sendMessage() → POST /school/conversations/{conversation}/messages
  → permission: messaging.send
  → SendMessageRequest
  → Broadcast via Reverb

editMessage() → PUT /school/conversations/{conversation}/messages/{message}
  → Vérifier sender = auth user

deleteMessage() → DELETE /school/conversations/{conversation}/messages/{message}
  → Vérifier sender ou admin conv

markRead() → POST /school/conversations/{conversation}/read
  → participant.last_read_at = now()

unreadCounts() → GET /school/messaging/unread-counts
  → UnreadCountsResource (messages + notifications + annonces)
  → Utilisé pour le badge dans la navbar

### AnnouncementController

index() → GET /school/announcements
  params: type, priority, is_read (bool), per_page
  → permission: messaging.view
  → Annonces ciblant le rôle de l'user courant
  → AnnouncementResource paginé

store() → POST /school/announcements
  → permission: messaging.send (role: school_admin/director)
  → StoreAnnouncementRequest

show() → GET /school/announcements/{announcement}
  → markRead() automatiquement à la lecture

update() → PUT /school/announcements/{announcement}
  → Interdit si publié depuis > 5 min (edit grace period)

publish() → POST /school/announcements/{announcement}/publish
  → permission: messaging.send
  → dispatch NotifyAnnouncementJob

destroy() → DELETE /school/announcements/{announcement}
  → soft delete, permission: messaging.send

markRead() → POST /school/announcements/{announcement}/read
  → AnnouncementRead::firstOrCreate

markAllRead() → POST /school/announcements/read-all

### NotificationController

index() → GET /school/notifications
  params: is_read (bool), type, per_page
  → permission: messaging.view (toujours — c'est mes propres notifs)
  → Notifications de l'user courant

markRead() → POST /school/notifications/{notification}/read

markAllRead() → POST /school/notifications/read-all
  → Retourne { marked: int }

destroy() → DELETE /school/notifications/{notification}
  → Seul l'owner peut supprimer

## ROUTES

Route::middleware(['auth:sanctum','tenant.active'])->group(function () {
  Route::prefix('school')->group(function () {

    // ── Compteurs non lus (sans module guard — toujours accessible) ──
    Route::get('messaging/unread-counts',
         [ConversationController::class, 'unreadCounts']);

    // ── Notifications (sans module guard — toujours accessible) ──
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read',
         [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all',
         [NotificationController::class, 'markAllRead']);
    Route::delete('notifications/{notification}',
         [NotificationController::class, 'destroy']);

    // ── Messagerie (avec module guard) ────────────────
    Route::middleware('module:messaging')->group(function () {

      // Conversations
      Route::get('conversations', [ConversationController::class, 'index']);
      Route::post('conversations', [ConversationController::class, 'store']);
      Route::get('conversations/{conversation}',
           [ConversationController::class, 'show']);
      Route::get('conversations/{conversation}/messages',
           [ConversationController::class, 'messages']);
      Route::post('conversations/{conversation}/messages',
           [ConversationController::class, 'sendMessage']);
      Route::put('conversations/{conversation}/messages/{message}',
           [ConversationController::class, 'editMessage']);
      Route::delete('conversations/{conversation}/messages/{message}',
           [ConversationController::class, 'deleteMessage']);
      Route::post('conversations/{conversation}/read',
           [ConversationController::class, 'markRead']);

      // Annonces
      Route::get('announcements', [AnnouncementController::class, 'index']);
      Route::post('announcements', [AnnouncementController::class, 'store'])
           ->middleware('role:school_admin,director');
      Route::get('announcements/{announcement}',
           [AnnouncementController::class, 'show']);
      Route::put('announcements/{announcement}',
           [AnnouncementController::class, 'update'])
           ->middleware('role:school_admin,director');
      Route::post('announcements/{announcement}/publish',
           [AnnouncementController::class, 'publish'])
           ->middleware('role:school_admin,director');
      Route::delete('announcements/{announcement}',
           [AnnouncementController::class, 'destroy'])
           ->middleware('role:school_admin,director');
      Route::post('announcements/{announcement}/read',
           [AnnouncementController::class, 'markRead']);
      Route::post('announcements/read-all',
           [AnnouncementController::class, 'markAllRead']);
    });
  });
});

## CONFIGURATION REVERB (config/broadcasting.php)

Canaux privés (auth obligatoire) :
  'conversation.{conversationId}' → vérifier que l'user est participant
  'user.{userId}.notifications'  → vérifier userId = auth user

Canal public (all users du tenant) :
  'announcements.{tenantId}'     → tous les users connectés

Dans routes/channels.php :
  Broadcast::channel('conversation.{id}', function (User $user, string $id) {
    return $user->conversations()->where('conversations.id', $id)
                ->whereNull('conversation_participants.left_at')->exists();
  });

  Broadcast::channel('user.{userId}.notifications', function (User $user, int $userId) {
    return $user->id === $userId;
  });

## TESTS HOPPSCOTCH

// Créer une conversation directe
POST /api/school/conversations
{ "type": "direct", "user_ids": [2] }
→ 201, ConversationResource

// Envoyer un message
POST /api/school/conversations/{id}/messages
{ "body": "Bonjour ! Avez-vous vu les résultats du DC1 ?" }
→ 201, MessageResource avec is_mine: true

// Récupérer les messages
GET /api/school/conversations/{id}/messages
→ 50 premiers messages paginés

// Créer une annonce
POST /api/school/announcements
{
  "title": "Réunion parents-professeurs",
  "body": "Une réunion parents-professeurs aura lieu le vendredi 31 janvier...",
  "type": "event",
  "priority": "high",
  "target_roles": ["teacher", "staff"]
}
→ 201, publiée immédiatement + notifications envoyées

// Compteurs non lus
GET /api/school/messaging/unread-counts
→ { messages: 3, notifications: 7, announcements: 1, total: 11 }

// Marquer tout comme lu
POST /api/school/notifications/read-all
→ { marked: 7 }

// Notifications d'un user
GET /api/school/notifications?is_read=false
→ liste des notifications non lues paginée
```

---

## SESSION 11.4 — Frontend : Types + API + Hooks

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, TanStack Query v5, Zustand v4
WebSocket : Laravel Echo + Pusher JS (pour Reverb)
Types existants : users.types.ts

Phase 11 Sessions 1-3 terminées ✅

## CONFIGURATION LARAVEL ECHO (shared/lib/echo.ts)

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${getToken()}`, // depuis authStore
      'X-Tenant': getTenantSlug(),
    },
  },
});

## GÉNÈRE LES FICHIERS SUIVANTS

### src/modules/school/types/messaging.types.ts

export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'file' | 'image' | 'system';
export type AnnouncementType = 'general' | 'academic' | 'event' | 'alert' | 'reminder';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  general: 'Général', academic: 'Pédagogique', event: 'Événement',
  alert: 'Alerte', reminder: 'Rappel',
};
export const ANNOUNCEMENT_PRIORITY_COLORS: Record<AnnouncementPriority, string> = {
  low: '#9ca3af', normal: '#3b82f6', high: '#f97316', urgent: '#ef4444',
};

export interface ConversationParticipant {
  id: number;
  full_name: string;
  avatar_url: string | null;
  role: { value: string; label: string };
}

export interface Conversation {
  id: string;
  type: { value: ConversationType; label: string };
  name: string;
  avatar: string | null;
  is_archived: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  participants_count: number;
  participants: ConversationParticipant[];
  last_message?: Message | null;
  created_at: string;
}

export interface MessageAttachment {
  path: string | null;
  name: string | null;
  size: number | null;
  url: string | null;
}

export interface Message {
  id: string;
  body: string;
  type: { value: MessageType; label: string };
  is_edited: boolean;
  is_deleted: boolean;
  edited_at: string | null;
  created_at: string;
  attachment: MessageAttachment | null;
  reply_to: { id: string; body: string; sender: { id: number; full_name: string } } | null;
  sender: { id: number; full_name: string; avatar_url: string | null; role: { value: string; label: string } } | null;
  is_mine: boolean;
  read_by_count: number;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  type: { value: AnnouncementType; label: string; icon: string; color: string };
  priority: { value: AnnouncementPriority; label: string; color: string };
  target_roles: string[];
  is_published: boolean;
  is_expired: boolean;
  is_scheduled: boolean;
  publish_at: string | null;
  expires_at: string | null;
  published_at: string | null;
  attachment_url: string | null;
  is_read: boolean;
  read_count: number;
  created_by?: { id: number; full_name: string };
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  action_url: string | null;
  icon: string | null;
  color: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UnreadCounts {
  messages: number;
  notifications: number;
  announcements: number;
  total: number;
}

export interface SendMessageData {
  body?: string;
  type?: MessageType;
  reply_to_id?: string;
  attachment?: File;
}

### src/modules/school/api/messaging.api.ts

import { apiClient } from '@/shared/lib/axios';

export const conversationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Conversation>>('/school/conversations', { params }),
  getOne: (id: string) =>
    apiClient.get<ApiSuccess<Conversation>>(`/school/conversations/${id}`),
  create: (data: { type: ConversationType; name?: string; user_ids: number[] }) =>
    apiClient.post<ApiSuccess<Conversation>>('/school/conversations', data),
  getMessages: (id: string, params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<Message>>(
      `/school/conversations/${id}/messages`, { params }),
  sendMessage: (id: string, formData: FormData) =>
    apiClient.post<ApiSuccess<Message>>(
      `/school/conversations/${id}/messages`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  editMessage: (convId: string, msgId: string, body: string) =>
    apiClient.put(`/school/conversations/${convId}/messages/${msgId}`, { body }),
  deleteMessage: (convId: string, msgId: string) =>
    apiClient.delete(`/school/conversations/${convId}/messages/${msgId}`),
  markRead: (id: string) =>
    apiClient.post(`/school/conversations/${id}/read`),
  getUnreadCounts: () =>
    apiClient.get<ApiSuccess<UnreadCounts>>('/school/messaging/unread-counts'),
};

export const announcementsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Announcement>>('/school/announcements', { params }),
  getOne: (id: number) =>
    apiClient.get<ApiSuccess<Announcement>>(`/school/announcements/${id}`),
  create: (formData: FormData) =>
    apiClient.post<ApiSuccess<Announcement>>('/school/announcements', formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: Partial<Announcement>) =>
    apiClient.put<ApiSuccess<Announcement>>(`/school/announcements/${id}`, data),
  publish: (id: number) =>
    apiClient.post<ApiSuccess<Announcement>>(`/school/announcements/${id}/publish`),
  delete: (id: number) =>
    apiClient.delete(`/school/announcements/${id}`),
  markRead: (id: number) =>
    apiClient.post(`/school/announcements/${id}/read`),
  markAllRead: () =>
    apiClient.post<ApiSuccess<{ marked: number }>>('/school/announcements/read-all'),
};

export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<AppNotification>>('/school/notifications', { params }),
  markRead: (id: string) =>
    apiClient.post(`/school/notifications/${id}/read`),
  markAllRead: () =>
    apiClient.post<ApiSuccess<{ marked: number }>>('/school/notifications/read-all'),
  delete: (id: string) =>
    apiClient.delete(`/school/notifications/${id}`),
};

### src/modules/school/hooks/useMessaging.ts

// Conversations
useConversations(filters?)
  → useQuery key: ['conversations']
  → staleTime: 30s

useConversationMessages(convId, page?)
  → useInfiniteQuery key: ['messages', convId]
  → fetch 50 par page, vers le haut (infinite scroll)

useCreateConversation()
  → useMutation + invalidate ['conversations']

useSendMessage(convId)
  → useMutation + update cache localement AVANT confirmation serveur
    (optimistic update pour UX instantanée)

useMarkConversationRead(convId)
  → useMutation + invalidate ['unread-counts']

// Annonces
useAnnouncements(filters?)
  → useQuery key: ['announcements', filters]

useMarkAnnouncementRead()
  → useMutation + invalidate ['announcements', 'unread-counts']

// Notifications
useNotifications(filters?)
  → useQuery key: ['notifications', filters]

useUnreadCounts()
  → useQuery key: ['unread-counts']
  → staleTime: 10s
  → Utilisé dans la navbar pour les badges

useMarkAllNotificationsRead()
  → useMutation + invalidate ['notifications', 'unread-counts']

// WebSocket (Reverb) — hooks temps réel
useConversationChannel(convId: string)
  → useEffect : écoute echo.private('conversation.{convId}')
  → On 'MessageSent' → ajouter le message au cache TanStack Query
  → On 'MessageEdited' → mettre à jour le message dans le cache
  → On 'MessageDeleted' → marquer comme supprimé dans le cache
  → cleanup : leave() au unmount

useNotificationsChannel(userId: number)
  → useEffect : écoute echo.private('user.{userId}.notifications')
  → On 'NotificationReceived' → invalider ['notifications', 'unread-counts']
  → Afficher un toast de notification (avec icône + titre)

useAnnouncementsChannel(tenantId: string)
  → useEffect : écoute echo.channel('announcements.{tenantId}')
  → On 'AnnouncementPublished' → invalider ['announcements', 'unread-counts']
```

---

## SESSION 11.5 — Frontend Pages

```
## CONTEXTE PROJET — ENMA SCHOOL

Stack : React 18 + TypeScript 5, Tailwind + shadcn/ui, TanStack Query v5
WebSocket : Laravel Echo + Reverb (configuré en Session 11.4)
Types, API, Hooks créés en Session 11.4 ✅

## GÉNÈRE LES PAGES ET COMPOSANTS

### 1. MessagingPage.tsx — Page principale

URL : /school/messaging

LAYOUT DEUX COLONNES (style WhatsApp/Slack) :

Colonne gauche (320px, fixe) :
  - Header : "Messages" + bouton [✏️ Nouveau message]
  - Barre de recherche conversations
  - Liste des conversations (ConversationList)

Colonne droite (flex) :
  - Si aucune conv sélectionnée → EmptyState "Sélectionnez une conversation"
  - Si conv sélectionnée → ChatWindow

### 2. ConversationList.tsx

Liste scrollable des conversations.
Chaque item (ConversationItem) :
  - Avatar (photo ou initiales si groupe)
  - Nom de la conversation
  - Aperçu du dernier message (tronqué à 50 chars)
  - Heure/date du dernier message
  - Badge nombre de messages non lus (si > 0)
  - Fond surligné si conversation active

Filtres rapides : [Tous] [Non lus] [Groupes]

### 3. ChatWindow.tsx — Fenêtre de chat

HEADER :
  Avatar + Nom de la conv + [ℹ️ Infos] [🔔 Silencieux]
  Pour les groupes : nombre de participants

ZONE DE MESSAGES :
  Scroll infini vers le haut (useInfiniteQuery)
  Pour chaque message :
  - Si is_mine → aligné à droite (fond bleu)
  - Si !is_mine → aligné à gauche (fond gris)
  - Avatar + nom de l'expéditeur (pour les groupes)
  - Corps du message
  - Si is_deleted → "[Message supprimé]" en italique gris
  - Si is_edited → badge "modifié" discret
  - Heure + badge lu (✓✓ si lu par tous)
  - Si reply_to → bloc citation en haut du message
  - Si attachment → aperçu ou lien de téléchargement
  - On hover → menu [↩️ Répondre] [✏️ Modifier] [🗑️ Supprimer]

SÉPARATEUR DE DATE :
  "Aujourd'hui", "Hier", "Lundi 13 Jan"...

ZONE DE SAISIE (bas) :
  [📎 Joindre] [Zone de texte (multi-ligne, max 5000 chars)] [Envoyer ▶]
  Si reply_to actif → bloc de citation au-dessus du champ
  Bouton [✕] pour annuler la réponse

TEMPS RÉEL :
  - Nouveaux messages via useConversationChannel
  - "[Prénom] est en train d'écrire..." (typing indicator — optionnel)
  - markRead() automatique à l'ouverture + en bas du scroll

### 4. NewConversationModal.tsx — Nouvelle conversation

Onglets : [💬 Direct] [👥 Groupe]

Direct :
  → SearchSelect des utilisateurs (par nom/email)
  → Sélectionner 1 utilisateur → créer + ouvrir la conv

Groupe :
  → Champ "Nom du groupe"
  → Multi-select utilisateurs (avec avatars)
  → Description (optionnel)
  → Bouton [Créer le groupe]

### 5. AnnouncementsPage.tsx — Annonces officielles

URL : /school/announcements

HEADER :
  Titre "Annonces" + bouton [+ Nouvelle annonce] (admin/directeur seulement)
  Filtres : Type (tous/général/pédagogique/événement/alerte)
             Statut (Toutes / Non lues)

LISTE DES ANNONCES :
  Chaque AnnouncementCard :
  - Badge type (coloré + icône)
  - Badge priorité (si high/urgent)
  - Titre (gras si non lue)
  - Aperçu du corps (50 mots)
  - Auteur + date de publication
  - "N personnes ont lu"
  - Clic → ouvre AnnouncementDetailModal + markRead()

BADGE "NON LU" :
  Point vert sur les annonces non lues
  Disparaît après lecture

### 6. AnnouncementFormModal.tsx — Créer une annonce

FORMULAIRE :
  1. Titre (string)
  2. Contenu (textarea rich ou simple)
  3. Type (select avec icônes : général/pédagogique/événement/alerte/rappel)
  4. Priorité (radio : faible/normal/haute/urgente)
  5. Destinataires (multi-select rôles) :
     ☑ Tous | Directeurs | Enseignants | Comptables | Personnel
  6. Publication :
     ○ Publier maintenant
     ○ Programmer pour le : [date picker]
  7. Expiration (optionnel, date picker)
  8. Pièce jointe (upload, optionnel)

### 7. NotificationCenter.tsx — Centre de notifications

Accessible via cloche 🔔 dans la Navbar (ou page dédiée).

PANEL SIDEBAR (slide-in depuis la droite) :
  Header : "Notifications" + [Tout marquer comme lu]
  Filtres : [Toutes] [Non lues]

  Liste des notifications :
  Chaque item :
  - Icône colorée selon le type
  - Titre + corps (tronqué)
  - Date relative ("il y a 5 min", "hier")
  - Fond différent si non lue (légèrement surligné)
  - Clic → markRead() + navigate(action_url)
  - Bouton [✕] pour supprimer

  TEMPS RÉEL :
  → useNotificationsChannel() écoute les nouveaux events Reverb
  → Toast discret en bas à droite pour chaque nouvelle notification :
    ┌─────────────────────────────────────┐
    │ 🎓 Bulletin de KOUASSI Jean publié  │
    │ 1er Trimestre 2024-2025             │
    │                    [Voir →] [✕]    │
    └─────────────────────────────────────┘

### 8. NavbarBadges.tsx — Badges non lus dans la Navbar

Composant intégré dans le DashboardLayout (mise à jour Phase 0).

  🔔 Notifications [7]   💬 Messages [3]   📢 Annonces [1]

  → useUnreadCounts() mis à jour toutes les 10s + par WebSocket
  → Badge rouge avec nombre si > 0, disparaît si = 0
  → useNotificationsChannel() pour mise à jour instantanée

## COMPOSANTS À CRÉER

1. ConversationItem.tsx
   Props: { conv: Conversation; isActive: boolean; onClick: fn }
   → Item de liste avec avatar, nom, aperçu, badge non lus

2. MessageBubble.tsx
   Props: { message: Message; showSender?: boolean }
   → Bulle de message avec toutes les interactions

3. MessageInput.tsx
   Props: { onSend: fn; replyTo?: Message | null; onCancelReply: fn }
   → Zone de saisie avec bouton envoi, pièce jointe, réponse

4. ReplyPreview.tsx
   Props: { message: Message; onCancel: fn }
   → Aperçu du message auquel on répond (citation)

5. AnnouncementCard.tsx
   Props: { announcement: Announcement; onClick: fn }
   → Card d'annonce avec badge type, priorité, statut lu/non-lu

6. AnnouncementPriorityBadge.tsx
   Props: { priority: AnnouncementPriority }
   → Badge coloré : faible/normal/haute/urgent

7. NotificationItem.tsx
   Props: { notification: AppNotification; onRead: fn; onDelete: fn }
   → Item notification avec icône, titre, date, état lu

8. NotificationToast.tsx
   Props: { notification: AppNotification }
   → Toast temps réel (affiché via useNotificationsChannel)

9. UnreadBadge.tsx
   Props: { count: number; max?: number }
   → Badge rouge "7" ou "99+" si count > max

10. DateSeparator.tsx
    Props: { date: string }
    → Séparateur "Aujourd'hui" / "Hier" / "13 Jan 2025"

## NAVIGATION (mise à jour)

Ajouter dans navigation.ts :
  /school/messaging         → MessagingPage      (icône: MessageSquare)
  /school/announcements     → AnnouncementsPage  (icône: Megaphone)
  /school/notifications     → (page ou panel)    (icône: Bell)

## VARIABLES D'ENVIRONNEMENT À AJOUTER (.env React)

VITE_REVERB_APP_KEY=enma-school-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http

## RÈGLES UX IMPORTANTES

1. Optimistic updates pour les messages :
   → Afficher le message immédiatement côté UI
   → Griser légèrement pendant la confirmation serveur
   → En cas d'erreur → afficher badge erreur + [Réessayer]

2. Scroll automatique :
   → Si l'user est en bas → scroller automatiquement à chaque nouveau message
   → Si l'user a remonté → afficher badge "X nouveaux messages ↓" (clic → scroll bas)

3. Infinite scroll vers le haut :
   → useInfiniteQuery avec IntersectionObserver sur le premier message
   → Charger 50 messages précédents à chaque scroll en haut

4. Notifications toast non intrusives :
   → Durée : 5 secondes
   → Position : bas droite
   → Maximum 3 toasts simultanés (LIFO)
   → Pas de toast si l'user est déjà sur la page concernée

5. Indicateur de connexion WebSocket :
   → Badge vert "En ligne" si Reverb connecté
   → Badge gris "Reconnexion..." si déconnecté
```

---

## RÉCAPITULATIF PHASE 11

| Session | Contenu | Fichiers clés |
|---------|---------|---------------|
| 11.1 | Migrations | `conversations`, `conversation_participants`, `messages`, `message_reads`, `announcements`, `announcement_reads`, `notifications` |
| 11.2 | Enums + Models + Services + Events + Jobs + Mails | `ConversationService`, `MessageService`, `AnnouncementService`, `NotificationService` (+ 7 méthodes onEvent), Events Reverb, `SendNotificationEmailJob`, `CheckOverduePaymentsJob` |
| 11.3 | Controllers + Resources + Routes | `ConversationController`, `AnnouncementController`, `NotificationController`, `UnreadCountsResource` |
| 11.4 | Frontend Types + API + Hooks + Echo config | `messaging.types.ts`, `messaging.api.ts`, `useMessaging.ts`, `echo.ts` (Reverb) |
| 11.5 | Frontend Pages + Composants | `MessagingPage` (layout 2 colonnes), `ChatWindow` (temps réel), `AnnouncementsPage`, `NotificationCenter` (panel slide-in), `NavbarBadges` (badges non lus) |

---

### Points d'attention critiques

1. **UUID pour conversations et messages** — `$keyType = 'string'`, `$incrementing = false`
   sur les models Conversation et Message (UUID auto-généré via `Str::uuid()` dans `boot()`)

2. **Notifications ≠ Model Laravel natif** — ne pas confondre avec
   `Illuminate\Notifications\Notification`. Ici c'est un Model custom
   dans le schema tenant avec `const UPDATED_AT = null`

3. **CheckOverduePaymentsJob schedulé** — ajouter dans `app/Console/Kernel.php` :
   `$schedule->job(new CheckOverduePaymentsJob)->dailyAt('08:00')`

4. **Canaux Reverb authorizés** — configurer `routes/channels.php` pour vérifier
   que l'user est bien participant avant d'autoriser l'écoute d'une conversation

5. **Optimistic updates messages** — pour une UX fluide, afficher le message
   IMMÉDIATEMENT dans l'UI sans attendre la réponse serveur (le mettre en cache
   TanStack avec un ID temporaire, puis remplacer par l'ID réel après confirmation)

6. **`module:messaging` guard** — les notifications système (onglet Notifications)
   sont TOUJOURS accessibles même sans le module messaging actif.
   Seule la messagerie directe et les annonces nécessitent le module.
