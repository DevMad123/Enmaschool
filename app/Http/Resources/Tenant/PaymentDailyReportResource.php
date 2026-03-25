<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentDailyReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = $this->resource;

        return [
            'date'                 => $data['date'],
            'total_amount'         => $data['total_amount'],
            'total_amount_formatted' => number_format($data['total_amount'], 0, ',', ' ') . ' FCFA',
            'payments_count'       => $data['payments_count'],
            'by_method'            => array_map(function ($item) {
                return [
                    'method_label' => $item['method_label'],
                    'amount'       => $item['amount'],
                    'amount_formatted' => number_format($item['amount'], 0, ',', ' ') . ' FCFA',
                    'count'        => $item['count'],
                ];
            }, $data['by_method']),
            'payments' => PaymentResource::collection($data['payments']),
        ];
    }
}
