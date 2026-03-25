# Enma School — SaaS EdTech Multi-Tenant

Plateforme de gestion scolaire multi-tenant basée sur Laravel 12, PostgreSQL, React et stancl/tenancy.

---

## Prérequis

- PHP >= 8.2 (fourni par Laragon)
- Composer
- Node.js >= 18 + npm
- PostgreSQL >= 15 (testé avec 18.2)
- Redis (fourni par Laragon — vérifier qu'il est démarré)

---

## Installation (après clonage GitHub)

### 1. Cloner le dépôt

```bash
git clone <url-du-repo> Enmaschool
cd Enmaschool
```

### 2. Installer les dépendances PHP

```bash
composer install
```

### 3. Copier et configurer le fichier d'environnement

```bash
cp .env.example .env
```

Ouvrir `.env` et renseigner au minimum :

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=enmaschool
DB_USERNAME=postgres
DB_PASSWORD=ton_mot_de_passe_postgres
```

> La base de données `enmaschool` doit déjà exister (créée via Adminer ou pgAdmin).

### 4. Générer la clé d'application

```bash
php artisan key:generate
```

### 5. Lancer les migrations

Ce projet utilise **stancl/tenancy** avec deux niveaux de migrations :

- **Migrations centrales** (schema `public`) — tables de l'app principale
- **Migrations tenant** (schema par tenant) — tables par école

```bash
# Migrations centrales uniquement
php artisan migrate
```

> Les migrations tenant (`database/migrations/tenant/`) sont exécutées automatiquement à la création de chaque tenant. Elles ne se lancent PAS avec `migrate` seul.

### 6. Lancer les seeders

```bash
php artisan db:seed
```

Cela crée :
- 3 plans (Starter, Pro, Premium)
- 1 tenant demo (`demo.enmaschool.com`) avec schema dédié
- 1 super admin central : `superadmin@enmaschool.com` / `password`
- Dans le tenant demo :
  - Admin école : `admin@demo.com` / `password`
  - Directeur : `directeur@demo.com` / `password`
  - Professeur : `prof@demo.com` / `password`
- Les modules système et paramètres globaux

### 7. Installer les dépendances front-end

```bash
npm install
```

### 8. Compiler les assets

Pour le développement (avec hot-reload) :

```bash
npm run dev
```

Pour la production :

```bash
npm run build
```

---

## Lancer le serveur de développement

### Avec Laragon

Laragon sert automatiquement le projet via Apache/Nginx. S'assurer que :
- Le **virtual host** pointe vers le dossier `public/`
- Le domaine configuré dans Laragon correspond à `APP_URL` dans `.env`
- **Redis** est démarré depuis le panneau Laragon

### Avec artisan (sans Laragon)

```bash
php artisan serve
```

---

## Configuration Redis (important)

Le projet utilise Redis pour les **sessions**, le **cache** et les **queues**.

Si Redis n'est pas disponible, modifier `.env` pour utiliser des drivers alternatifs :

```env
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

---

## Variables d'environnement importantes

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `APP_URL` | URL de l'application centrale | `http://enmaschool.test` |
| `TENANCY_CENTRAL_DOMAINS` | Domaines centraux (hors tenants) | `enmaschool.test,localhost` |
| `SESSION_DOMAIN` | Domaine partagé pour les cookies | `.enmaschool.test` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | *(à renseigner)* |
| `REDIS_PASSWORD` | Mot de passe Redis | `null` |

---

## Multi-tenancy

Ce projet utilise [stancl/tenancy](https://tenancyforlaravel.com/) en mode **multi-database** (un schema PostgreSQL par tenant).

- Les routes centrales sont dans `routes/central.php`
- Les routes tenant sont dans `routes/api.php`
- Un tenant est résolu via son sous-domaine : `{slug}.enmaschool.test`

Pour lancer les migrations d'un tenant existant :

```bash
php artisan tenants:migrate
```

Pour un tenant spécifique :

```bash
php artisan tenants:migrate --tenants=demo
```

---

## Commandes utiles

```bash
# Vider tous les caches
php artisan optimize:clear

# Lancer les queues (développement)
php artisan queue:listen --tries=1

# Dashboard Horizon (queues)
php artisan horizon

# Serveur WebSocket Reverb
php artisan reverb:start
```

---

## Stack technique

- **Backend** : Laravel 12, PHP 8.2, PostgreSQL 18
- **Multi-tenancy** : stancl/tenancy 3.x
- **Auth** : Laravel Sanctum
- **Permissions** : spatie/laravel-permission
- **Frontend** : React 18, TypeScript, Tailwind CSS 4, Vite
- **UI** : Radix UI, Lucide, TanStack Query/Table
- **Queue** : Laravel Horizon + Redis
- **WebSocket** : Laravel Reverb
- **PDF** : barryvdh/laravel-dompdf
