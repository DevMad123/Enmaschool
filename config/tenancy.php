<?php
// ===== config/tenancy.php =====

declare(strict_types=1);

use App\Models\Central\Tenant;
use App\Models\Central\Domain;
use Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper;
use Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper;
use Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper;
use Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper;

return [
    /**
     * --------------------------------------------------------------------------
     * Tenant & Domain Models
     * --------------------------------------------------------------------------
     */
    'tenant_model' => Tenant::class,
    'id_generator' => Stancl\Tenancy\UUIDGenerator::class,

    'domain_model' => Domain::class,

    /**
     * --------------------------------------------------------------------------
     * Central Domains
     * --------------------------------------------------------------------------
     * Domains that host the central (non-tenant) application.
     * Subdomains of these domains will be used for tenant identification.
     */
    'central_domains' => [
        'enmaschool.com',
        'localhost',
        '127.0.0.1',
    ],

    /**
     * --------------------------------------------------------------------------
     * Bootstrappers
     * --------------------------------------------------------------------------
     * Executed when tenancy is initialized to make Laravel features tenant-aware.
     */
    'bootstrappers' => [
        DatabaseTenancyBootstrapper::class,
        CacheTenancyBootstrapper::class,
        FilesystemTenancyBootstrapper::class,
        QueueTenancyBootstrapper::class,
    ],

    /**
     * --------------------------------------------------------------------------
     * Database Tenancy — Schema-per-Tenant (PostgreSQL)
     * --------------------------------------------------------------------------
     */
    'database' => [
        'central_connection' => env('DB_CONNECTION', 'central'),

        'template_tenant_connection' => null,

        /**
         * Tenant schema names: prefix + tenant_id + suffix
         * e.g. tenant_3f2504e0-4f89-11d3-9a0c-0305e82c3301
         */
        'prefix' => 'tenant_',
        'suffix' => '',

        /**
         * Database managers — PostgreSQLSchemaManager for schema-per-tenant.
         */
        'managers' => [
            'pgsql' => Stancl\Tenancy\TenantDatabaseManagers\PostgreSQLSchemaManager::class,
        ],
    ],

    /**
     * --------------------------------------------------------------------------
     * Cache Tenancy
     * --------------------------------------------------------------------------
     */
    'cache' => [
        'tag_base' => 'tenant',
    ],

    /**
     * --------------------------------------------------------------------------
     * Filesystem Tenancy
     * --------------------------------------------------------------------------
     */
    'filesystem' => [
        'suffix_base' => 'tenant',
        'disks' => [
            'local',
            'public',
        ],

        'root_override' => [
            'local' => '%storage_path%/app/',
            'public' => '%storage_path%/app/public/',
        ],

        'suffix_storage_path' => true,
        'asset_helper_tenancy' => true,
    ],

    /**
     * --------------------------------------------------------------------------
     * Redis Tenancy
     * --------------------------------------------------------------------------
     */
    'redis' => [
        'prefix_base' => 'tenant',
        'prefixed_connections' => [
            'default',
        ],
    ],

    /**
     * --------------------------------------------------------------------------
     * Features
     * --------------------------------------------------------------------------
     */
    'features' => [
        Stancl\Tenancy\Features\ViteBundler::class,
    ],

    /**
     * --------------------------------------------------------------------------
     * Tenancy Routes
     * --------------------------------------------------------------------------
     */
    'routes' => true,

    /**
     * --------------------------------------------------------------------------
     * Tenant Migrations
     * --------------------------------------------------------------------------
     */
    'migration_parameters' => [
        '--force' => true,
        '--path' => [database_path('migrations/tenant')],
        '--realpath' => true,
    ],

    /**
     * --------------------------------------------------------------------------
     * Tenant Seeder
     * --------------------------------------------------------------------------
     */
    'seeder_parameters' => [
        '--class' => 'Database\\Seeders\\TenantDatabaseSeeder',
    ],
];
