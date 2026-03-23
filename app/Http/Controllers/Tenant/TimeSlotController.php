<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\TimeSlotResource;
use App\Models\Tenant\TimeSlot;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeSlotController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = TimeSlot::query()->orderBy('day_of_week')->orderBy('order');

        if ($request->filled('day')) {
            $query->forDay((int) $request->input('day'));
        }

        if ($request->boolean('active_only', false)) {
            $query->active();
        }

        if ($request->boolean('no_breaks', false)) {
            $query->notBreak();
        }

        $slots = $query->get();

        return $this->success(TimeSlotResource::collection($slots));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:50'],
            'day_of_week'      => ['required', 'integer', 'between:1,6'],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:480'],
            'is_break'         => ['boolean'],
            'order'            => ['required', 'integer', 'min:1'],
            'is_active'        => ['boolean'],
        ]);

        $slot = TimeSlot::create($validated);

        return $this->created(new TimeSlotResource($slot));
    }

    public function update(Request $request, TimeSlot $timeSlot): JsonResponse
    {
        $validated = $request->validate([
            'name'             => ['sometimes', 'string', 'max:50'],
            'day_of_week'      => ['sometimes', 'integer', 'between:1,6'],
            'start_time'       => ['sometimes', 'date_format:H:i'],
            'end_time'         => ['sometimes', 'date_format:H:i'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1', 'max:480'],
            'is_break'         => ['sometimes', 'boolean'],
            'order'            => ['sometimes', 'integer', 'min:1'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        $timeSlot->update($validated);

        return $this->success(new TimeSlotResource($timeSlot));
    }

    public function destroy(TimeSlot $timeSlot): JsonResponse
    {
        // Check if used in any timetable entry
        if ($timeSlot->timetableEntries()->exists()) {
            return $this->error('Ce créneau est utilisé dans des emplois du temps et ne peut pas être supprimé.', 422);
        }

        $timeSlot->delete();

        return $this->success(null, 'Créneau supprimé.');
    }

    public function toggle(TimeSlot $timeSlot): JsonResponse
    {
        $timeSlot->update(['is_active' => ! $timeSlot->is_active]);

        return $this->success(new TimeSlotResource($timeSlot));
    }
}
