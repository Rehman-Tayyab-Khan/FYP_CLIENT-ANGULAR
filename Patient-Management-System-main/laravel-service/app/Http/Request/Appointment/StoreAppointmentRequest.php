<?php

namespace App\Http\Request\Appointment;

use App\Enums\AppointmentType;
use App\Enums\ReminderMethod;
use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only FDO and Admin can create appointments
        return in_array(auth()->user()->role->value, [Role::ADMIN->value, Role::FDO->value]);
    }

    public function rules(): array
    {
        return [
            'case_id' => ['required', 'uuid', 'exists:patient_cases,id'],
            'patient_id' => ['required', 'uuid', 'exists:patients,id'],
            'doctor_id' => ['required', 'uuid', 'exists:doctor_profiles,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'appointment_type' => ['required', new Enum(AppointmentType::class)],
            'specialty_id' => ['required', 'uuid', 'exists:specialties,id'],
            'practice_location_id' => ['required', 'uuid', 'exists:practice_locations,id'],
            'duration_minutes' => ['sometimes', 'integer', 'min:5', 'max:480'],
            'reminder_method' => ['nullable', new Enum(ReminderMethod::class)],
            'notes' => ['nullable', 'string'],
            'reason_for_visit' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'appointment_date.after_or_equal' => 'Appointment date cannot be in the past.',
            'case_id.exists' => 'The selected case does not exist.',
            'doctor_id.exists' => 'The selected doctor does not exist.',
        ];
    }
}
