<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\ParentModel;

class ParentService
{
    public function create(array $data): ParentModel
    {
        return ParentModel::create($data);
    }

    /**
     * Cherche un parent existant par téléphone ou email avant de créer.
     * Évite les doublons lors des imports et des créations rapides.
     */
    public function createOrFind(array $data): ParentModel
    {
        if (! empty($data['phone'])) {
            $existing = ParentModel::where('phone', $data['phone'])->first();
            if ($existing) {
                return $existing;
            }
        }

        if (! empty($data['email'])) {
            $existing = ParentModel::where('email', $data['email'])->first();
            if ($existing) {
                return $existing;
            }
        }

        return $this->create($data);
    }

    public function update(ParentModel $parent, array $data): ParentModel
    {
        $parent->update($data);

        return $parent->fresh();
    }

    public function delete(ParentModel $parent): void
    {
        $hasActiveStudents = $parent->students()
            ->whereHas('enrollments', fn ($q) => $q->where('is_active', true))
            ->exists();

        if ($hasActiveStudents) {
            throw new \RuntimeException('Impossible de supprimer un parent ayant des élèves actuellement inscrits.');
        }

        $parent->delete();
    }
}
