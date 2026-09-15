<?php

namespace App\Http\Request\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class CompleteAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'diagnoses_id' => ['nullable', 'uuid', 'exists:diagnoses,id'],
            'diagnosis_icd_code' => ['required_without:diagnoses_id', 'string', 'max:50'],
            'diagnosis_description' => ['required_without:diagnoses_id', 'string', 'max:1000'],
            'diagnosis_is_active' => ['sometimes', 'boolean'],

            'visit_duration_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'symptoms' => ['required', 'string'],
            'treatment' => ['required', 'string'],
            'treatment_plan' => ['nullable', 'string'],
            'prescription' => ['required', 'string'],
            'notes' => ['required', 'string'],

            'follow_up_required' => ['sometimes', 'boolean'],
            'follow_up_date' => ['nullable', 'date', 'required_if:follow_up_required,true'],
            'referral_made' => ['sometimes', 'boolean'],
            'referral_to' => ['nullable', 'string', 'required_if:referral_made,true'],
        ];
    }

    public function messages(): array
    {
        return [
            'diagnosis_icd_code.required_without' => 'Diagnosis ICD code is required when no existing diagnosis is selected.',
            'diagnosis_description.required_without' => 'Diagnosis description is required when no existing diagnosis is selected.',
            'follow_up_date.required_if' => 'Follow-up date is required when follow-up is marked as required.',
            'referral_to.required_if' => 'Referral target is required when referral is marked as made.',
        ];
    }
}
