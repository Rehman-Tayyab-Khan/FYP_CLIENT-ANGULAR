<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'appointment_number' => $this->appointment_number,

            // Case
            'case_id' => $this->case_id,
            'case_number' => $this->whenLoaded('patientCase', fn() =>
            $this->patientCase?->case_number),

            // Patient
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn() =>
            trim(($this->patient?->first_name ?? '') . ' ' . ($this->patient?->last_name ?? ''))),

            // Doctor
            'doctor_id' => $this->doctor_id,
            'doctor_name' => $this->whenLoaded('doctor', fn() =>
            trim(($this->doctor?->user?->first_name ?? '') . ' ' . ($this->doctor?->user?->last_name ?? ''))),

            // Specialty
            'specialty_id' => $this->specialty_id,
            'specialty_name' => $this->whenLoaded('specialty', fn() =>
            $this->specialty?->specialty_name),

            // Location
            'practice_location_id' => $this->practice_location_id,
            'practice_location_name' => $this->whenLoaded('practiceLocation', fn() =>
            $this->practiceLocation?->location_name),

            // Schedule
            'appointment_date' => $this->appointment_date?->format('Y-m-d'),
            'appointment_time' => $this->appointment_time,
            'end_time' => $this->end_time,   // computed accessor
            'duration_minutes' => $this->duration_minutes,

            // Type & Status
            'appointment_type' => $this->appointment_type,
            'status' => $this->status,

            // Reminder
            'reminder_sent' => $this->reminder_sent,
            'reminder_method' => $this->reminder_method,

            // Notes
            'notes' => $this->notes,
            'reason_for_visit' => $this->reason_for_visit,

            // Created by FDO
            'created_by' => $this->created_by,
            'created_by_name' => $this->whenLoaded('createdBy', fn() =>
            trim(($this->createdBy?->first_name ?? '') . ' ' . ($this->createdBy?->last_name ?? ''))),

            // Visit (loaded only when appointment is completed)
            'visit_id' => $this->whenLoaded('visit', fn() =>
            $this->visit?->id),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
