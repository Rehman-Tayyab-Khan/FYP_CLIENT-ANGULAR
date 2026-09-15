<?php
// app/Services/AppointmentService.php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Enums\Role;
use App\Models\Appointment;
use App\Models\Diagnoses;
use App\Models\Visit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    // Build filtered + paginated list
    public function getAll(Request $request, $user): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with([
                'patient',
                'doctor.user',
                'specialty',
                'practiceLocation',
                'patientCase',
                'createdBy',
            ]);

        // Doctor sees only their own appointments
        if ($user->role->value === Role::DOCTOR->value) {
            $query->where('doctor_id', $user->doctorProfile?->id);
        }

        // Patient Name filter
        if ($request->filled('patient_name')) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->whereRaw(
                    "CONCAT(first_name, ' ', last_name) LIKE ?",
                    ['%' . $request->patient_name . '%']
                );
            });
        }

        // Doctor Name filter
        if ($request->filled('doctor_name')) {
            $query->whereHas('doctor.user', function ($q) use ($request) {
                $q->whereRaw(
                    "CONCAT(first_name, ' ', last_name) LIKE ?",
                    ['%' . $request->doctor_name . '%']
                );
            });
        }

        // Specialty filter
        if ($request->filled('specialty_id')) {
            $query->where('specialty_id', $request->specialty_id);
        }

        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('appointment_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('appointment_date', '<=', $request->date_to);
        }

        // Appointment Type filter
        if ($request->filled('appointment_type')) {
            $query->where('appointment_type', $request->appointment_type);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Practice Location filter
        if ($request->filled('practice_location_id')) {
            $query->where('practice_location_id', $request->practice_location_id);
        }

        // Created By (FDO) filter
        if ($request->filled('created_by')) {
            $query->where('created_by', $request->created_by);
        }

        return $query
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->paginate($request->input('per_page', 15));
    }

    // Get single appointment
    public function getById(Appointment $appointment): Appointment
    {
        return $appointment->load([
            'patient',
            'doctor.user',
            'specialty',
            'practiceLocation',
            'patientCase',
            'createdBy',
            'visit',
        ]);
    }

    // Create appointment
    public function create(array $data, string $createdBy): Appointment
    {
        // Check doctor is not double-booked
        $this->checkDoctorConflict(
            $data['doctor_id'],
            $data['appointment_date'],
            $data['appointment_time']
        );

        $data['created_by'] = $createdBy;

        $appointment = Appointment::create($data);

        return $appointment->load([
            'patient',
            'doctor.user',
            'specialty',
            'practiceLocation',
            'patientCase',
            'createdBy',
        ]);
    }

    // Update appointment
    public function update(Appointment $appointment, array $data, string $role): Appointment
    {
        if ($role === Role::DOCTOR->value) {
            $data = array_intersect_key($data, array_flip(['status']));
        }

        // Cannot update cancelled appointment
        if ($appointment->status === AppointmentStatus::CANCELLED) {
            throw new \Exception('Cannot update a cancelled appointment.', 422);
        }

        // Non-admin cannot update a completed appointment
        if ($appointment->status === AppointmentStatus::COMPLETED && $role !== Role::ADMIN->value) {
            throw new \Exception('Cannot update a completed appointment.', 422);
        }

        // If date or time is changing — check for conflicts
        if (isset($data['appointment_date']) || isset($data['appointment_time'])) {
            // appointment_date is cast to Carbon by the model — format to Y-m-d string for the DB query
            $existingDate = $appointment->appointment_date instanceof \Carbon\Carbon
                ? $appointment->appointment_date->format('Y-m-d')
                : $appointment->appointment_date;

            $this->checkDoctorConflict(
                $data['doctor_id'] ?? $appointment->doctor_id,
                $data['appointment_date'] ?? $existingDate,
                $data['appointment_time'] ?? $appointment->appointment_time,
                $appointment->id   // exclude current appointment from conflict check
            );

            // Auto-mark as rescheduled when date/time changes (FDO or Admin)
            if ($role !== Role::DOCTOR->value) {
                $data['status'] = AppointmentStatus::RESCHEDULED->value;
            }
        }

        $appointment->update($data);

        return $appointment->load([
            'patient',
            'doctor.user',
            'specialty',
            'practiceLocation',
            'patientCase',
            'createdBy',
        ]);
    }

    // Cancel appointment
    public function cancel(Appointment $appointment): void
    {
        if ($appointment->status === AppointmentStatus::COMPLETED) {
            throw new \Exception('Cannot cancel a completed appointment.', 422);
        }

        if ($appointment->status === AppointmentStatus::CANCELLED) {
            throw new \Exception('Appointment is already cancelled.', 422);
        }

        $appointment->update(['status' => AppointmentStatus::CANCELLED->value]);
    }

    // Soft delete
    public function delete(Appointment $appointment): void
    {
        $appointment->delete();
    }

    public function completeByDoctor(
        Appointment $appointment,
        array $data,
        string $doctorProfileId
    ): array {
        if ($appointment->doctor_id !== $doctorProfileId) {
            throw new \Exception('Unauthorized.', 403);
        }

        if ($appointment->status === AppointmentStatus::CANCELLED) {
            throw new \Exception('Cannot complete a cancelled appointment.', 422);
        }

        return DB::transaction(function () use ($appointment, $data) {
            $diagnosis = $this->resolveDiagnosis($data);

            if ($appointment->status !== AppointmentStatus::COMPLETED) {
                $appointment->update(['status' => AppointmentStatus::COMPLETED->value]);
            }

            $appointment->refresh();
            $appointment->load('visit');

            $visit = $appointment->visit;

            if (!$visit) {
                $visit = Visit::createFromAppointment($appointment);
            }

            $followUpRequired = (bool) ($data['follow_up_required'] ?? false);
            $referralMade = (bool) ($data['referral_made'] ?? false);

            $visit->update([
                'diagnoses_id' => $diagnosis->id,
                'visit_duration_minutes' => $data['visit_duration_minutes'] ?? $visit->visit_duration_minutes,
                'symptoms' => trim((string) $data['symptoms']),
                'treatment' => trim((string) $data['treatment']),
                'treatment_plan' => isset($data['treatment_plan']) ? trim((string) $data['treatment_plan']) : null,
                'prescription' => trim((string) $data['prescription']),
                'notes' => trim((string) $data['notes']),
                'follow_up_required' => $followUpRequired,
                'follow_up_date' => $followUpRequired ? ($data['follow_up_date'] ?? null) : null,
                'referral_made' => $referralMade,
                'referral_to' => $referralMade ? ($data['referral_to'] ?? null) : null,
                'visit_status' => 'Completed',
                'completed_at' => now(),
            ]);

            return [
                'appointment' => $appointment->load([
                    'patient',
                    'doctor.user',
                    'specialty',
                    'practiceLocation',
                    'patientCase',
                    'createdBy',
                    'visit',
                ]),
                'visit' => $visit->fresh()->load([
                    'appointment:id,appointment_number',
                    'case:id,case_number',
                    'patient:id,first_name,last_name',
                    'doctor:id,user_id',
                    'doctor.user:id,first_name,last_name',
                    'diagnoses:id,icd_code,diagnoses_name,description,is_active',
                ]),
            ];
        });
    }

    private function resolveDiagnosis(array $data): Diagnoses
    {
        if (!empty($data['diagnoses_id'])) {
            return Diagnoses::findOrFail($data['diagnoses_id']);
        }

        $icdCode = strtoupper(trim((string) ($data['diagnosis_icd_code'] ?? '')));
        $description = trim((string) ($data['diagnosis_description'] ?? ''));

        if ($icdCode === '' || $description === '') {
            throw new \Exception('Diagnosis details are required to complete appointment.', 422);
        }

        return Diagnoses::updateOrCreate(
            ['icd_code' => $icdCode],
            [
                'diagnoses_name' => $description,
                'description' => $description,
                'is_active' => (bool) ($data['diagnosis_is_active'] ?? true),
            ]
        );
    }

    // Private: doctor conflict check
    private function checkDoctorConflict(
        string $doctorId,
        string $date,
        string $time,
        ?string $excludeId = null
    ): void {
        $query = Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('appointment_time', $time)
            ->whereNotIn('status', [
                AppointmentStatus::CANCELLED->value,
                AppointmentStatus::NO_SHOW->value,
            ]);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($query->exists()) {
            throw new \Exception(
                'Doctor already has an appointment at this date and time.',
                422
            );
        }
    }
}
