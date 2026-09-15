<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InsuranceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'insurance_name' => $this->insurance_name,
            'insurance_code' => $this->insurance_code,
            'is_active' => $this->is_active,
            'primary_address' => $this->whenLoaded('primaryAddress', function () {
                if (!$this->primaryAddress) {
                    return null;
                }

                return [
                    'id' => $this->primaryAddress->id,
                    'address' => $this->primaryAddress->address,
                    'phone' => $this->primaryAddress->phone,
                    'is_primary' => $this->primaryAddress->is_primary,
                ];
            }),
            'addresses' => $this->whenLoaded('insuranceAddress', function () {
                return $this->insuranceAddress->map(function ($address) {
                    return [
                        'id' => $address->id,
                        'address' => $address->address,
                        'phone' => $address->phone,
                        'is_primary' => $address->is_primary,
                    ];
                })->values();
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
