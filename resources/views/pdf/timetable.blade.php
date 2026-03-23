<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Emploi du temps — {{ $classe->display_name }}</title>
  <style>
    /* DomPDF : pas de flexbox/grid — tables uniquement */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "DejaVu Sans", Arial, sans-serif;
      font-size: 8px;
      color: #1a1a1a;
      padding: 8mm;
    }

    /* En-tête */
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .header-top {
      width: 100%;
    }
    .header-top td { vertical-align: middle; }
    .school-name { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1e1b4b; }
    .school-sub  { font-size: 8px; color: #6b7280; margin-top: 2px; }
    .title-cell  { text-align: center; }
    .main-title  { font-size: 14px; font-weight: bold; color: #4f46e5; }
    .subtitle    { font-size: 9px; color: #374151; margin-top: 3px; }
    .right-cell  { text-align: right; font-size: 8px; color: #6b7280; }

    /* Grille */
    .grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .grid th, .grid td {
      border: 1px solid #d1d5db;
      padding: 3px 4px;
      vertical-align: top;
    }
    .grid th {
      background-color: #4f46e5;
      color: #ffffff;
      font-weight: bold;
      text-align: center;
      font-size: 8px;
    }
    .col-slot {
      background-color: #f8fafc;
      width: 70px;
      font-size: 7.5px;
      color: #374151;
    }
    .slot-name  { font-weight: bold; color: #1e293b; }
    .slot-time  { color: #64748b; font-size: 7px; }
    .break-row td {
      background-color: #fef3c7;
      text-align: center;
      color: #92400e;
      font-style: italic;
      font-size: 7.5px;
      padding: 2px;
    }
    .entry-cell {
      min-height: 28px;
    }
    .entry-subject {
      font-weight: bold;
      color: #1e293b;
      font-size: 7.5px;
    }
    .entry-teacher { color: #64748b; font-size: 7px; margin-top: 1px; }
    .entry-room    { color: #9ca3af; font-size: 7px; }
    .empty-cell    { color: #e2e8f0; text-align: center; font-size: 10px; }

    /* Footer */
    .footer {
      margin-top: 8px;
      border-top: 1px solid #e5e7eb;
      padding-top: 4px;
      font-size: 7px;
      color: #9ca3af;
      text-align: right;
    }
  </style>
</head>
<body>

{{-- ── En-tête ────────────────────────────────────────────────── --}}
<div class="header">
  <table class="header-top" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width:33%">
        @if($school)
          <div class="school-name">{{ $school['name'] ?? 'École' }}</div>
          @if(!empty($school['motto']))
            <div class="school-sub">{{ $school['motto'] }}</div>
          @endif
        @endif
      </td>
      <td style="width:34%" class="title-cell">
        <div class="main-title">EMPLOI DU TEMPS</div>
        <div class="subtitle">
          <strong>Classe :</strong> {{ $classe->display_name }}
          &nbsp;|&nbsp;
          <strong>Année :</strong> {{ $academicYear->name }}
        </div>
      </td>
      <td style="width:33%" class="right-cell">
        Édité le {{ now()->format('d/m/Y') }}<br>
        @if($classe->mainTeacher)
          Prof. principal : {{ $classe->mainTeacher->full_name }}
        @endif
      </td>
    </tr>
  </table>
</div>

{{-- ── Grille ──────────────────────────────────────────────────── --}}
<table class="grid" cellpadding="0" cellspacing="0">
  <thead>
    <tr>
      <th class="col-slot">Créneau</th>
      @foreach($days as $dayNum => $dayLabel)
        <th>{{ $dayLabel }}</th>
      @endforeach
    </tr>
  </thead>
  <tbody>
    @foreach($slotOrders as $order)
      @php
        // Récupérer le premier slot de cet ordre (template)
        $templateSlot = $slotsByOrder[$order]->first();
        $isBreak = $templateSlot?->is_break ?? false;
      @endphp

      @if($isBreak)
        {{-- Ligne de pause --}}
        <tr class="break-row">
          <td>{{ $templateSlot->name }}</td>
          @foreach($days as $dayNum => $dayLabel)
            <td></td>
          @endforeach
        </tr>
      @else
        <tr>
          {{-- Colonne créneau --}}
          <td class="col-slot">
            <span class="slot-name">{{ $templateSlot?->name }}</span><br>
            <span class="slot-time">
              {{ substr($templateSlot?->start_time ?? '', 0, 5) }}
              –
              {{ substr($templateSlot?->end_time ?? '', 0, 5) }}
            </span>
          </td>

          {{-- Colonnes jours --}}
          @foreach($days as $dayNum => $dayLabel)
            @php
              $daySlot  = $slotsByOrder[$order]->first(fn($s) => (($s->day_of_week instanceof \App\Enums\DayOfWeek ? $s->day_of_week->value : (int)$s->day_of_week) === (int)$dayNum));
              $entry    = $daySlot ? ($entries->get((int)$dayNum)?->firstWhere('time_slot_id', $daySlot->id)) : null;
              $bg       = $entry?->color ? ltrim($entry->color, '#') : null;
            @endphp
            <td class="entry-cell"
              @if($bg)
                style="border-left: 3px solid #{{ $bg }}; background-color: #{{ $bg }}11;"
              @endif
            >
              @if($entry)
                <div class="entry-subject">{{ $entry->subject?->name }}</div>
                @if($entry->teacher)
                  <div class="entry-teacher">{{ $entry->teacher->full_name }}</div>
                @endif
                @if($entry->room)
                  <div class="entry-room">{{ $entry->room->name }}</div>
                @endif
              @else
                <span class="empty-cell">–</span>
              @endif
            </td>
          @endforeach
        </tr>
      @endif
    @endforeach
  </tbody>
</table>

{{-- ── Footer ──────────────────────────────────────────────────── --}}
<div class="footer">
  Enma School — Emploi du temps généré automatiquement
</div>

</body>
</html>
