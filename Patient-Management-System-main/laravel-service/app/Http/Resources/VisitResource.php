<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'visit_number' => $this->visit_number,

            'appointment_id' => $this->appointment_id,
            'appointment_number' => $this->whenLoaded('appointment', fn() => $this->appointment?->appointment_number),

            'case_id' => $this->case_id,
            'case_number' => $this->whenLoaded('case', fn() => $this->case?->case_number),

            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn() => trim(($this->patient?->first_name ?? '') . ' ' . ($this->patient?->last_name ?? ''))),

            'doctor_id' => $this->doctor_id,
            'doctor_name' => $this->whenLoaded('doctor', fn() => trim(($this->doctor?->user?->first_name ?? '') . ' ' . ($this->doctor?->user?->last_name ?? ''))),

            'visit_date' => $this->visit_date,
            'visit_time' => $this->visit_time,
            'visit_duration_minutes' => $this->visit_duration_minutes,

            'diagnoses_id' => $this->diagnoses_id,
            'diagnoses_name' => $this->whenLoaded('diagnoses', fn() => $this->diagnoses?->diagnoses_name),
            'diagnoses_icd_code' => $this->whenLoaded('diagnoses', fn() => $this->diagnoses?->icd_code),
            'diagnoses_description' => $this->whenLoaded('diagnoses', fn() => $this->diagnoses?->description),
            'diagnoses_is_active' => $this->whenLoaded('diagnoses', fn() => (bool) $this->diagnoses?->is_active),

            'treatment' => $this->treatment,
            'treatment_plan' => $this->treatment_plan,
            'prescription' => $this->prescription,
            'prescription_documents' => $this->prescription_documents,
            'notes' => $this->notes,
            'vital_signs' => $this->vital_signs,
            'symptoms' => $this->symptoms,

            'follow_up_required' => (bool) $this->follow_up_required,
            'follow_up_date' => $this->follow_up_date,
            'referral_made' => (bool) $this->referral_made,
            'referral_to' => $this->referral_to,

            'visit_status' => $this->visit_status,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
