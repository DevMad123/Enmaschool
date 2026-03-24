<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin de notes — {{ $student['full_name'] }}</title>
  <style>
    /* DomPDF : pas de flexbox/grid — tables et divs simples */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "DejaVu Sans", Arial, sans-serif;
      font-size: 10px;
      color: #1a1a1a;
      padding: 10mm;
    }

    /* En-tête */
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-bottom: 10px;
      text-align: center;
    }
    .header img { height: 60px; margin-bottom: 4px; }
    .school-name  { font-size: 15px; font-weight: bold; text-transform: uppercase; }
    .school-sub   { font-size: 9px; color: #555; margin-top: 2px; }
    .bulletin-title {
      font-size: 13px;
      font-weight: bold;
      color: #2563eb;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Infos élève */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      background: #f8fafc;
    }
    .info-table td {
      padding: 4px 6px;
      font-size: 9px;
      border: 1px solid #e2e8f0;
    }
    .info-table td strong { color: #374151; }

    /* Tableau des notes */
    .grades-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9px;
    }
    .grades-table th {
      background: #2563eb;
      color: #ffffff;
      padding: 5px 4px;
      text-align: center;
      font-weight: bold;
      font-size: 8px;
    }
    .grades-table th.left { text-align: left; padding-left: 6px; }
    .grades-table td {
      border: 1px solid #d1d5db;
      padding: 4px;
      text-align: center;
      vertical-align: middle;
    }
    .grades-table td.left { text-align: left; padding-left: 6px; }
    .pass { background-color: #dcfce7; }
    .fail { background-color: #fee2e2; }
    .average-row td {
      background: #dbeafe;
      font-weight: bold;
      font-size: 10px;
    }
    .average-row td.total {
      font-size: 11px;
      color: #1d4ed8;
    }

    /* Section absences / décision */
    .bottom-section {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .bottom-section td {
      padding: 6px 8px;
      vertical-align: top;
      border: 1px solid #d1d5db;
      font-size: 9px;
    }

    /* Décision */
    .decision-box {
      text-align: center;
      padding: 6px;
      font-size: 11px;
      font-weight: bold;
      border: 2px solid #374151;
      margin-top: 8px;
      background: #f0f9ff;
    }
    .decision-pass   { border-color: #16a34a; color: #15803d; background: #f0fdf4; }
    .decision-repeat { border-color: #dc2626; color: #b91c1c; background: #fef2f2; }
    .decision-honor  { border-color: #7c3aed; color: #6d28d9; background: #f5f3ff; }

    /* Signatures */
    .signatures-table {
      width: 100%;
      margin-top: 20px;
      border-collapse: collapse;
    }
    .signatures-table td {
      text-align: center;
      padding: 10px 6px;
      font-size: 9px;
      vertical-align: bottom;
    }
    .sig-line {
      border-top: 1px solid #9ca3af;
      margin-top: 30px;
      padding-top: 4px;
      font-size: 8px;
      color: #6b7280;
    }

    /* Pied de page */
    .footer {
      position: fixed;
      bottom: 5mm;
      left: 10mm;
      right: 10mm;
      border-top: 1px solid #d1d5db;
      padding-top: 3px;
      font-size: 7.5px;
      color: #6b7280;
      text-align: center;
    }

    /* Bloc mention */
    .mention-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: bold;
    }
  </style>
</head>
<body>

  {{-- PIED DE PAGE (rendu en premier pour positionnement fixed) --}}
  <div class="footer">
    {{ $school['name'] }}
    @if($school['address']) | {{ $school['address'] }} @endif
    @if($school['phone']) | Tél: {{ $school['phone'] }} @endif
    | Généré le {{ $generated_at }}
    @if($pdf_hash) | Réf: {{ substr($pdf_hash, 0, 8) }} @endif
  </div>

  {{-- EN-TÊTE --}}
  <div class="header">
    @if(!empty($school['logo_url']))
      <img src="{{ $school['logo_url'] }}" alt="Logo" />
    @endif
    <div class="school-name">{{ $school['name'] }}</div>
    @if($school['address'] || $school['phone'])
      <div class="school-sub">
        {{ $school['address'] }}
        @if($school['phone']) — Tél: {{ $school['phone'] }} @endif
        @if($school['email']) | {{ $school['email'] }} @endif
      </div>
    @endif
    <div class="bulletin-title">
      Bulletin de notes —
      @if($period)
        {{ strtoupper($period['name']) }}
      @else
        Bilan Annuel
      @endif
       — {{ $academic_year['name'] }}
    </div>
  </div>

  {{-- INFOS ÉLÈVE --}}
  <table class="info-table">
    <tr>
      <td><strong>Nom &amp; Prénom :</strong> {{ $student['full_name'] }}</td>
      <td><strong>Matricule :</strong> {{ $student['matricule'] }}</td>
      <td><strong>Classe :</strong> {{ $classe['display_name'] }}</td>
    </tr>
    <tr>
      <td>
        <strong>Date de naissance :</strong>
        {{ $student['birth_date'] ?? '—' }}
        @if($student['birth_place'])
          à {{ $student['birth_place'] }}
        @endif
      </td>
      <td><strong>Niveau :</strong> {{ $classe['level_label'] ?? '—' }}</td>
      <td><strong>Prof. principal :</strong> {{ $classe['main_teacher_name'] ?? '—' }}</td>
    </tr>
  </table>

  {{-- ═══════════════════════════════════════════════════════════════════ --}}
  {{-- BULLETIN DE PÉRIODE --}}
  {{-- ═══════════════════════════════════════════════════════════════════ --}}
  @if($period !== null)

  <table class="grades-table">
    <thead>
      <tr>
        <th class="left" style="width:24%;">Matière</th>
        <th style="width:7%;">Coeff</th>
        <th style="width:10%;">Moy /20</th>
        <th style="width:9%;">Rang</th>
        <th style="width:10%;">Moy cl.</th>
        <th style="width:7%;">Min</th>
        <th style="width:7%;">Max</th>
        <th class="left" style="width:26%;">Appréciation</th>
      </tr>
    </thead>
    <tbody>
      @foreach($subjects as $s)
      @php
        $rowClass = isset($s['is_passing'])
          ? ($s['is_passing'] ? 'pass' : 'fail')
          : '';
      @endphp
      <tr class="{{ $rowClass }}">
        <td class="left">{{ $s['name'] }}</td>
        <td>{{ $s['coefficient'] }}</td>
        <td><strong>{{ $s['period_average'] !== null ? number_format((float)$s['period_average'], 2) : '—' }}</strong></td>
        <td>{{ $s['rank'] !== null ? $s['rank'] . ($s['rank'] === 1 ? 'er' : 'e') . '/' . ($stats['class_size'] ?? '?') : '—' }}</td>
        <td>{{ $s['class_average'] !== null ? number_format((float)$s['class_average'], 2) : '—' }}</td>
        <td>{{ $s['min_score'] !== null ? number_format((float)$s['min_score'], 2) : '—' }}</td>
        <td>{{ $s['max_score'] !== null ? number_format((float)$s['max_score'], 2) : '—' }}</td>
        <td class="left" style="font-size:8px; font-style:italic;">{{ $s['appreciation'] ?? '' }}</td>
      </tr>
      @endforeach

      {{-- Ligne moyenne générale --}}
      <tr class="average-row">
        <td class="left" colspan="2">Moyenne Générale</td>
        <td class="total">
          {{ $stats['general_average'] !== null ? number_format((float)$stats['general_average'], 2) . '/20' : '—' }}
        </td>
        <td>
          {{ $stats['general_rank'] !== null
            ? $stats['general_rank'] . ($stats['general_rank'] === 1 ? 'er' : 'e') . '/' . ($stats['class_size'] ?? '?')
            : '—' }}
        </td>
        <td>{{ $stats['class_average'] !== null ? number_format((float)$stats['class_average'], 2) : '—' }}</td>
        <td colspan="3"></td>
      </tr>
    </tbody>
  </table>

  {{-- ═══════════════════════════════════════════════════════════════════ --}}
  {{-- BULLETIN ANNUEL --}}
  {{-- ═══════════════════════════════════════════════════════════════════ --}}
  @else

  @php
    $pt = $academic_year['period_type'] ?? 'trimester';
    $col1 = $pt === 'semester' ? '1er Sem.' : '1er Trim.';
    $col2 = $pt === 'semester' ? '2e Sem.'  : '2e Trim.';
    $col3 = $pt !== 'semester'             ? '3e Trim.' : null;
  @endphp

  <table class="grades-table">
    <thead>
      <tr>
        <th class="left" style="width:22%;">Matière</th>
        <th style="width:6%;">Coeff</th>
        <th style="width:9%;">{{ $col1 }}</th>
        <th style="width:9%;">{{ $col2 }}</th>
        @if($col3)<th style="width:9%;">{{ $col3 }}</th>@endif
        <th style="width:10%;">Annuel</th>
        <th style="width:9%;">Rang</th>
        <th class="left">Appréciation</th>
      </tr>
    </thead>
    <tbody>
      @foreach($subjects as $s)
      @php
        $rowClass = isset($s['is_passing'])
          ? ($s['is_passing'] ? 'pass' : 'fail')
          : '';
      @endphp
      <tr class="{{ $rowClass }}">
        <td class="left">{{ $s['name'] }}</td>
        <td>{{ $s['coefficient'] }}</td>
        <td>{{ $s['period_1_avg'] !== null ? number_format((float)$s['period_1_avg'], 2) : '—' }}</td>
        <td>{{ $s['period_2_avg'] !== null ? number_format((float)$s['period_2_avg'], 2) : '—' }}</td>
        @if($col3)
          <td>{{ $s['period_3_avg'] !== null ? number_format((float)$s['period_3_avg'], 2) : '—' }}</td>
        @endif
        <td><strong>{{ $s['annual_avg'] !== null ? number_format((float)$s['annual_avg'], 2) : '—' }}</strong></td>
        <td>{{ $s['rank'] !== null ? $s['rank'] . ($s['rank'] === 1 ? 'er' : 'e') . '/' . ($stats['class_size'] ?? '?') : '—' }}</td>
        <td class="left" style="font-size:8px; font-style:italic;">{{ $s['appreciation'] ?? '' }}</td>
      </tr>
      @endforeach

      {{-- Moyennes générales par période --}}
      @if(!empty($period_generals))
      <tr class="average-row" style="background:#e0f2fe;">
        <td class="left" colspan="2">Moy. générale</td>
        @foreach($period_generals as $pg)
          <td>{{ $pg['average'] !== null ? number_format((float)$pg['average'], 2) : '—' }}</td>
        @endforeach
        @if(count($period_generals) < ($col3 ? 3 : 2))
          @for($i = count($period_generals); $i < ($col3 ? 3 : 2); $i++)
            <td>—</td>
          @endfor
        @endif
        <td class="total">
          {{ $stats['general_average'] !== null ? number_format((float)$stats['general_average'], 2) . '/20' : '—' }}
        </td>
        <td>
          {{ $stats['general_rank'] !== null
            ? $stats['general_rank'] . ($stats['general_rank'] === 1 ? 'er' : 'e') . '/' . ($stats['class_size'] ?? '?')
            : '—' }}
        </td>
        <td></td>
      </tr>
      @endif
    </tbody>
  </table>

  @endif

  {{-- ABSENCES & APPRÉCIATION CONSEIL --}}
  <table class="bottom-section">
    <tr>
      <td style="width:40%;">
        <strong>Absences :</strong><br>
        Justifiées : <strong>{{ $stats['absences_justified'] }}h</strong>
        &nbsp;|&nbsp;
        Non justifiées : <strong>{{ $stats['absences_unjustified'] }}h</strong>
      </td>
      <td style="width:60%;">
        <strong>Appréciation du conseil de classe :</strong><br>
        <em>{{ $stats['general_appreciation'] ?? '—' }}</em>
      </td>
    </tr>
  </table>

  {{-- DÉCISION DU CONSEIL --}}
  @if($stats['council_decision'])
  @php
    $decisionClass = match($stats['council_decision']) {
      'pass', 'conditional', 'honor' => 'decision-pass',
      'repeat', 'excluded'           => 'decision-repeat',
      default                        => '',
    };
    if ($stats['council_decision'] === 'honor') $decisionClass = 'decision-honor';
  @endphp
  <div class="decision-box {{ $decisionClass }}">
    DÉCISION : {{ strtoupper($stats['council_decision_label']) }}
    @if($stats['honor_mention'])
      &nbsp;—&nbsp; {{ strtoupper($stats['honor_mention_label']) }}
    @endif
  </div>
  @endif

  {{-- SIGNATURES --}}
  <table class="signatures-table">
    <tr>
      <td style="width:33%;">
        Le Professeur Principal
        <div class="sig-line">Signature</div>
      </td>
      <td style="width:33%;">
        Signature des Parents / Tuteur
        <div class="sig-line">Lu et approuvé</div>
      </td>
      <td style="width:33%;">
        Le Directeur<br>
        <strong>{{ $school['director_name'] ?? '' }}</strong>
        <div class="sig-line">Cachet de l'établissement</div>
      </td>
    </tr>
  </table>

</body>
</html>
