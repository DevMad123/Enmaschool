<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 10px; color: #1f2937; }
  .page { padding: 24px; }

  .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
  .header .school { font-size: 20px; font-weight: bold; color: #1e40af; }
  .header .report-title { font-size: 15px; font-weight: bold; margin-top: 8px; }
  .header .year { font-size: 12px; color: #6b7280; margin-top: 4px; }

  h2 { font-size: 12px; font-weight: bold; color: #1e40af; background: #dbeafe; padding: 6px 10px; border-left: 4px solid #2563eb; margin: 20px 0 10px; border-radius: 0 4px 4px 0; }

  .kpi-grid { display: flex; gap: 10px; margin-bottom: 16px; }
  .kpi-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; text-align: center; background: #f9fafb; }
  .kpi-value { font-size: 22px; font-weight: bold; color: #2563eb; }
  .kpi-label { font-size: 8px; color: #6b7280; margin-top: 4px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9px; }
  th { background: #2563eb; color: white; padding: 6px 8px; text-align: left; font-weight: bold; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }

  .progress-bar-container { background: #e5e7eb; border-radius: 4px; height: 10px; margin-top: 4px; }
  .progress-bar { background: #2563eb; border-radius: 4px; height: 10px; }
  .progress-bar.good { background: #16a34a; }
  .progress-bar.medium { background: #d97706; }
  .progress-bar.bad { background: #dc2626; }

  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #9ca3af; text-align: center; }
  .page-break { page-break-after: always; }
</style>
</head>
<body>
<div class="page">
  <!-- En-tête -->
  <div class="header">
    <div class="school">{{ $school_name }}</div>
    <div class="report-title">Synthèse Annuelle</div>
    <div class="year">Année scolaire {{ $year->name }}</div>
    <div class="year" style="margin-top:4px; font-size:9px">Généré le {{ $generated_at }}</div>
  </div>

  <!-- Section : Effectifs -->
  <h2>1. Effectifs et Personnel</h2>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-value">{{ $direction['students']['total'] }}</div>
      <div class="kpi-label">Élèves inscrits</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $direction['students']['by_gender']['male'] }}</div>
      <div class="kpi-label">Garçons</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $direction['students']['by_gender']['female'] }}</div>
      <div class="kpi-label">Filles</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $direction['staff']['total'] }}</div>
      <div class="kpi-label">Personnel</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $direction['staff']['teachers'] }}</div>
      <div class="kpi-label">Enseignants</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $direction['academic']['classes_count'] }}</div>
      <div class="kpi-label">Classes</div>
    </div>
  </div>

  @if(!empty($direction['students']['by_category']))
  <table>
    <thead><tr><th>Catégorie</th><th>Effectif</th></tr></thead>
    <tbody>
      @foreach($direction['students']['by_category'] as $category => $count)
      <tr><td>{{ ucfirst($category) }}</td><td>{{ $count }}</td></tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <!-- Section : Résultats académiques -->
  <h2>2. Résultats Académiques</h2>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-value">{{ $academic['overall']['avg_general'] !== null ? number_format($academic['overall']['avg_general'], 2) : '-' }}</div>
      <div class="kpi-label">Moyenne générale</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value" style="color:{{ $academic['overall']['passing_rate'] >= 60 ? '#16a34a' : '#dc2626' }}">{{ $academic['overall']['passing_rate'] }}%</div>
      <div class="kpi-label">Taux de réussite</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $academic['evaluations_this_period'] }}</div>
      <div class="kpi-label">Évaluations</div>
    </div>
    @if($academic['overall']['top_classe'])
    <div class="kpi-box">
      <div class="kpi-value" style="font-size:14px">{{ $academic['overall']['top_classe']['display_name'] }}</div>
      <div class="kpi-label">Meilleure classe ({{ number_format($academic['overall']['top_classe']['average'], 2) }})</div>
    </div>
    @endif
  </div>

  @if(!empty($academic['by_level']))
  <table>
    <thead><tr><th>Niveau</th><th>Classes</th><th>Élèves</th><th>Moyenne</th><th>Taux réussite</th></tr></thead>
    <tbody>
      @foreach($academic['by_level'] as $level)
      <tr>
        <td>{{ $level['level']['label'] }}</td>
        <td>{{ $level['classes_count'] }}</td>
        <td>{{ $level['students_count'] }}</td>
        <td>{{ $level['avg_general'] !== null ? number_format($level['avg_general'], 2) : '-' }}</td>
        <td>{{ $level['passing_rate'] }}%</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <div class="page-break"></div>

  <!-- Section : Présences -->
  <h2>3. Présences et Absences</h2>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-value">{{ $attendance['today']['overall_rate'] !== null ? $attendance['today']['overall_rate'] . '%' : '-' }}</div>
      <div class="kpi-label">Taux présence du jour</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $attendance['period']['avg_rate'] }}%</div>
      <div class="kpi-label">Taux moyen période</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $attendance['period']['total_absent_hours'] }}h</div>
      <div class="kpi-label">Heures d'absence totales</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ count($attendance['at_risk_students']) }}</div>
      <div class="kpi-label">Élèves à risque</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value">{{ $attendance['justifications']['pending'] }}</div>
      <div class="kpi-label">Justif. en attente</div>
    </div>
  </div>

  @if(!empty($attendance['at_risk_students']))
  <table>
    <thead><tr><th>Élève</th><th>Classe</th><th>Taux présence</th><th>Heures absence</th></tr></thead>
    <tbody>
      @foreach($attendance['at_risk_students'] as $student)
      <tr>
        <td>{{ $student['student']['full_name'] }}</td>
        <td>{{ $student['classe'] }}</td>
        <td style="color:#dc2626">{{ $student['attendance_rate'] }}%</td>
        <td>{{ $student['absent_hours'] }}h</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <!-- Section : Finance -->
  <h2>4. Situation Financière</h2>
  @php
    $rate = $financial['summary']['collection_rate'];
    $barClass = $rate >= 75 ? 'good' : ($rate >= 50 ? 'medium' : 'bad');
  @endphp
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-value" style="font-size:13px">{{ $financial['summary']['total_expected_formatted'] }}</div>
      <div class="kpi-label">Total attendu</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value" style="font-size:13px; color:#16a34a">{{ $financial['summary']['total_collected_formatted'] }}</div>
      <div class="kpi-label">Collecté</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value" style="font-size:13px; color:#dc2626">{{ $financial['summary']['total_remaining_formatted'] }}</div>
      <div class="kpi-label">Restant</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-value" style="color:{{ $rate >= 75 ? '#16a34a' : ($rate >= 50 ? '#d97706' : '#dc2626') }}">{{ $rate }}%</div>
      <div class="kpi-label">Taux recouvrement</div>
      <div class="progress-bar-container">
        <div class="progress-bar {{ $barClass }}" style="width:{{ min(100, $rate) }}%"></div>
      </div>
    </div>
  </div>

  @if(!empty($financial['by_fee_type']))
  <table>
    <thead><tr><th>Type de frais</th><th>Attendu</th><th>Collecté</th><th>Taux</th></tr></thead>
    <tbody>
      @foreach($financial['by_fee_type'] as $ft)
      <tr>
        <td>{{ $ft['fee_type']['name'] }}</td>
        <td>{{ number_format($ft['expected'], 0, ',', ' ') }} FCFA</td>
        <td>{{ number_format($ft['collected'], 0, ',', ' ') }} FCFA</td>
        <td>{{ $ft['rate'] }}%</td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @endif

  <!-- Signature -->
  <div style="margin-top:40px; display:flex; justify-content:flex-end;">
    <div style="border-top:1px solid #374151; padding-top:6px; width:200px; text-align:center; font-size:9px; color:#6b7280;">
      Le Directeur
    </div>
  </div>

  <div class="footer">{{ $school_name }} — Synthèse Annuelle {{ $year->name }} — Confidentiel</div>
</div>
</body>
</html>
