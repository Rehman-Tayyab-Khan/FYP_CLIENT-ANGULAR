<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiagnosesResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'icd_code' => $this->icd_code,
            'diagnoses_name' => $this->diagnoses_name,
            'description' => $this->description,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
