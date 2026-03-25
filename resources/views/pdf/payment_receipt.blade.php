<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: DejaVu Sans; font-size: 11px; color: #1a1a1a; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 15px; }
    .receipt-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-top: 6px; }
    .receipt-number { font-size: 14px; color: #6b7280; margin-top: 2px; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; color: #374151; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 3px 4px; vertical-align: top; }
    .data-table thead tr { background: #2563eb; color: white; }
    .data-table thead th { padding: 5px 6px; text-align: left; }
    .data-table tbody tr td { padding: 5px 6px; border-bottom: 1px solid #f3f4f6; }
    .total-row td { font-weight: bold; font-size: 13px; background: #f0f9ff; padding: 6px; }
    .stamp { text-align: center; margin-top: 30px; color: #6b7280; font-size: 9px; }
    .paid-stamp-wrap { text-align: center; margin: 20px 0; }
    .paid-stamp {
      display: inline-block;
      font-size: 22px; font-weight: bold;
      color: #16a34a; border: 3px solid #16a34a;
      padding: 6px 18px;
      transform: rotate(-15deg);
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .fw-bold { font-weight: bold; }
  </style>
</head>
<body>

  {{-- En-tête école --}}
  <div class="header">
    @if(!empty($school['logo_url']))
      <img src="{{ $school['logo_url'] }}" height="50" alt="Logo" />
    @endif
    <div class="fw-bold" style="font-size:14px; margin-top:4px;">{{ $school['name'] }}</div>
    @if(!empty($school['address']) || !empty($school['phone']))
      <div>{{ $school['address'] }}@if(!empty($school['phone'])) — Tél : {{ $school['phone'] }}@endif</div>
    @endif
    <div class="receipt-title">REÇU DE PAIEMENT</div>
    <div class="receipt-number">N° {{ $payment['receipt_number'] }}</div>
  </div>

  {{-- Informations de paiement --}}
  <div class="section">
    <div class="section-title">Informations de paiement</div>
    <table>
      <tr>
        <td width="25%"><strong>Date :</strong></td>
        <td width="25%">{{ $payment['payment_date'] }}</td>
        <td width="25%"><strong>Mode :</strong></td>
        <td width="25%">{{ $payment['payment_method_label'] }}</td>
      </tr>
      @if(!empty($payment['reference']))
      <tr>
        <td><strong>Référence :</strong></td>
        <td colspan="3">{{ $payment['reference'] }}</td>
      </tr>
      @endif
      <tr>
        <td><strong>Encaissé par :</strong></td>
        <td colspan="3">{{ $payment['recorded_by'] }}</td>
      </tr>
    </table>
  </div>

  {{-- Informations élève --}}
  <div class="section">
    <div class="section-title">Élève</div>
    <table>
      <tr>
        <td width="25%"><strong>Nom & Prénom :</strong></td>
        <td width="25%">{{ $student['full_name'] }}</td>
        <td width="25%"><strong>Matricule :</strong></td>
        <td width="25%">{{ $student['matricule'] }}</td>
      </tr>
      <tr>
        <td><strong>Classe :</strong></td>
        <td>{{ $classe['display_name'] }}</td>
        <td><strong>Année scolaire :</strong></td>
        <td>{{ $academic_year['name'] }}</td>
      </tr>
    </table>
  </div>

  {{-- Détail du paiement --}}
  <div class="section">
    <div class="section-title">Détail du paiement</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="text-align:left;">Type de frais</th>
          <th style="text-align:right;">Montant dû</th>
          <th style="text-align:right;">Déjà payé</th>
          <th style="text-align:right;">Ce versement</th>
          <th style="text-align:right;">Reste dû</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ $student_fee['fee_type_name'] }}</td>
          <td class="text-right">{{ number_format($student_fee['amount_due'], 0, ',', ' ') }} FCFA</td>
          <td class="text-right">{{ number_format($student_fee['amount_previously_paid'], 0, ',', ' ') }} FCFA</td>
          <td class="text-right fw-bold">{{ number_format($payment['amount'], 0, ',', ' ') }} FCFA</td>
          <td class="text-right">{{ number_format($student_fee['amount_remaining'], 0, ',', ' ') }} FCFA</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" class="text-right">MONTANT VERSÉ :</td>
          <td class="text-right" style="font-size:14px;">{{ number_format($payment['amount'], 0, ',', ' ') }} FCFA</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>

  {{-- Cachet "SOLDÉ" si le frais est intégralement payé --}}
  @if(!empty($student_fee['is_fully_paid']))
  <div class="paid-stamp-wrap">
    <div class="paid-stamp">✓ SOLDÉ</div>
  </div>
  @endif

  {{-- Signatures --}}
  <table style="width:100%; margin-top:30px;">
    <tr>
      <td width="50%" class="text-center">
        Signature du Caissier<br><br><br>___________________
      </td>
      <td width="50%" class="text-center">
        Cachet de l'Établissement<br><br><br>___________________
      </td>
    </tr>
  </table>

  <div class="stamp">
    Document généré le {{ $generated_at }} | {{ $school['name'] }} | N° {{ $payment['receipt_number'] }}<br>
    Ce reçu est un document officiel. Toute modification le rend invalide.
  </div>

</body>
</html>
