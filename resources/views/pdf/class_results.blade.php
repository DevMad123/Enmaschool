<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 10px; color: #1f2937; }
  .page { padding: 20px; }

  /* En-tête */
  .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
  .header .school { font-size: 16px; font-weight: bold; color: #1e40af; }
  .header .subtitle { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .header .report-title { font-size: 14px; font-weight: bold; margin-top: 8px; }

  /* Meta-infos */
  .meta { display: flex; justify-content: space-between; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; font-size: 9px; }
  .meta span { font-weight: bold; }

  /* Tableau */
  table { width: 100%; border-collapse: collapse; font-size: 8px; }
  thead tr { background: #2563eb; color: white; }
  thead th { padding: 6px 4px; text-align: center; border: 1px solid #1d4ed8; font-weight: bold; }
  th.left { text-align: left; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody tr:hover { background: #eff6ff; }
  tbody td { padding: 5px 4px; border: 1px solid #e5e7eb; text-align: center; }
  td.left { text-align: left; }
  .avg-cell { font-weight: bold; }
  .pass { color: #16a34a; }
  .fail { color: #dc2626; }

  /* Pied de tableau */
  .tfoot-row { background: #dbeafe; font-weight: bold; }
  tfoot td { padding: 6px 4px; border: 1px solid #bfdbfe; text-align: center; font-weight: bold; }

  /* Statistiques */
  .stats { display: flex; gap: 12px; margin-top: 16px; }
  .stat-box { flex: 1; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px; text-align: center; }
  .stat-value { font-size: 16px; font-weight: bold; color: #2563eb; }
  .stat-label { font-size: 8px; color: #6b7280; margin-top: 2px; }

  /* Signature */
  .signature { margin-top: 30px; text-align: right; }
  .signature .sig-line { display: inline-block; border-top: 1px solid #374151; padding-top: 4px; width: 200px; text-align: center; font-size: 9px; color: #6b7280; }

  /* Footer */
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <!-- En-tête -->
  <div class="header">
    <div class="school">{{ $school_name }}</div>
    <div class="subtitle">Tableau des résultats scolaires</div>
    <div class="report-title">{{ $classe->display_name }} — {{ $period->name }} — {{ $period->academicYear->name }}</div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div>Classe : <span>{{ $classe->display_name }}</span></div>
    <div>Niveau : <span>{{ $classe->level?->label }}</span></div>
    <div>Effectif : <span>{{ $enrollments->count() }} élèves</span></div>
    <div>Période : <span>{{ $period->name }}</span></div>
    <div>Généré le : <span>{{ $generated_at }}</span></div>
  </div>

  <!-- Tableau des résultats -->
  <table>
    <thead>
      <tr>
        <th style="width:20px">#</th>
        <th class="left" style="width:120px">Nom & Prénom</th>
        @foreach($subjects as $subject)
          <th style="min-width:35px" title="{{ $subject->name }}">
            {{ Str::limit($subject->code ?? $subject->name, 6) }}
          </th>
        @endforeach
        <th style="width:45px">Moy. Gén.</th>
        <th style="width:30px">Rang</th>
        <th style="width:50px">Décision</th>
      </tr>
    </thead>
    <tbody>
      @foreach($enrollments as $i => $enrollment)
        @php
          $periodAvg = $enrollment->periodAverages->first();
          $avg = $periodAvg?->average;
          $isPassing = $avg !== null && $avg >= $passing_avg;
        @endphp
        <tr>
          <td>{{ $i + 1 }}</td>
          <td class="left">{{ $enrollment->student?->last_name }} {{ $enrollment->student?->first_name }}</td>
          @foreach($subjects as $subject)
            @php
              $subAvg = \App\Models\Tenant\PeriodAverage::where('enrollment_id', $enrollment->id)
                ->where('subject_id', $subject->id)
                ->where('period_id', $period->id)
                ->value('average');
            @endphp
            <td class="{{ $subAvg !== null && $subAvg >= $passing_avg ? 'pass' : ($subAvg !== null ? 'fail' : '') }}">
              {{ $subAvg !== null ? number_format($subAvg, 2) : '-' }}
            </td>
          @endforeach
          <td class="avg-cell {{ $isPassing ? 'pass' : ($avg !== null ? 'fail' : '') }}">
            {{ $avg !== null ? number_format($avg, 2) : '-' }}
          </td>
          <td>{{ $periodAvg?->rank ?? '-' }}</td>
          <td class="{{ $isPassing ? 'pass' : 'fail' }}">
            {{ $periodAvg?->decision ?? ($isPassing ? 'Admis' : 'Redouble') }}
          </td>
        </tr>
      @endforeach
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:left; padding-left:8px">Statistiques de la classe</td>
        @foreach($subjects as $subject)
          @php
            $subjectClassAvg = \App\Models\Tenant\PeriodAverage::whereIn(
              'enrollment_id', $enrollments->pluck('id')
            )->where('subject_id', $subject->id)->where('period_id', $period->id)->avg('average');
          @endphp
          <td>{{ $subjectClassAvg ? number_format($subjectClassAvg, 2) : '-' }}</td>
        @endforeach
        <td>{{ $class_avg !== null ? number_format($class_avg, 2) : '-' }}</td>
        <td colspan="2">Moy. classe</td>
      </tr>
    </tfoot>
  </table>

  <!-- Statistiques -->
  @php
    $passingCount = $enrollments->filter(fn($e) => $e->periodAverages->first()?->average >= $passing_avg)->count();
    $passingRate  = $enrollments->count() > 0 ? round($passingCount / $enrollments->count() * 100, 1) : 0;
    $maxAvg = $enrollments->max(fn($e) => $e->periodAverages->first()?->average);
    $minAvg = $enrollments->min(fn($e) => $e->periodAverages->first()?->average);
  @endphp
  <div class="stats">
    <div class="stat-box">
      <div class="stat-value">{{ $enrollments->count() }}</div>
      <div class="stat-label">Effectif total</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#16a34a">{{ $passingCount }}</div>
      <div class="stat-label">Admis ({{ $passingRate }}%)</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#dc2626">{{ $enrollments->count() - $passingCount }}</div>
      <div class="stat-label">Redoublants</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ $class_avg !== null ? number_format($class_avg, 2) : '-' }}</div>
      <div class="stat-label">Moyenne classe</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ $maxAvg !== null ? number_format($maxAvg, 2) : '-' }}</div>
      <div class="stat-label">Meilleure note</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">{{ $minAvg !== null ? number_format($minAvg, 2) : '-' }}</div>
      <div class="stat-label">Note la plus basse</div>
    </div>
  </div>

  <!-- Signature directeur -->
  <div class="signature">
    <div class="sig-line">Le Directeur</div>
  </div>

  <div class="footer">{{ $school_name }} — Tableau des résultats {{ $classe->display_name }} — {{ $period->name }}</div>
</div>
</body>
</html>
