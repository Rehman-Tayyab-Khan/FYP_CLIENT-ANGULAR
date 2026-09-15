<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\PatientCase;
use App\Models\Appointment;
use App\Models\Visit;
use App\Models\DoctorProfile;
use App\Models\User;
use App\Enums\AppointmentStatus;
use App\Enums\CaseStatus;
use App\Enums\VisitStatus;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getStats(): array
    {
        $today = Carbon::today();

        //INFO: carbon::now also contains current time
        $startOfMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth();

        // INFO: deep copy
        $startOfLastMonth = $lastMonth->copy()->startOfMonth();
        $endOfLastMonth = $lastMonth->copy()->endOfMonth();

        // Total Patients & Monthly Change
        $totalPatients = Patient::count();
        $patientsThisMonth = Patient::where('created_at', '>=', $startOfMonth)->count();
        $patientsLastMonth = Patient::whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->count();

        // INFO: percentage that patients changed from last month
        $patientChangePercent = 0;
        if ($patientsLastMonth > 0) {
            $patientChangePercent = round((($patientsThisMonth - $patientsLastMonth) / $patientsLastMonth) * 100, 1);
        }

        // Active Cases & Today's New Cases
        $activeCases = PatientCase::where('case_status', CaseStatus::ACTIVE)->count();
        $newCasesToday = PatientCase::whereDate('created_at' ,  $today)->count();

        // Today's Appointments
        // whereDate because it ignores time 
        $todayAppointments = Appointment::whereDate('appointment_date', $today)->count();

        // Completed Visits & Completion Rate
        $completedVisits = Visit::where('visit_status', VisitStatus::COMPLETED)->count();
        $totalVisits = Visit::count();
        $completionRate = $totalVisits > 0 ? round(($completedVisits / $totalVisits) * 100) : 0;

        // Appointments Trend (Last 30 Days)
        $appointmentsTrend = Appointment::select(DB::raw('DATE(appointment_date) as date'), 
        DB::raw('count(*) as count'))
            ->where('appointment_date', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // INFO: categorise cases based on type of cases, 
        // and count how many cases are in each category.
        $caseCategories = PatientCase::select('category', DB::raw('count(*) as count'))
            ->where('case_status', CaseStatus::ACTIVE)
            ->groupBy('category')
            ->get();

        // INFO: Recent 5 Patients
        $recentPatients = Patient::orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($patient) {
                $firstName = $patient->first_name ?? '';
                $lastName = $patient->last_name ?? '';
                $fullName = trim("{$firstName} {$lastName}");

                return [
                    'id' => $patient->id,
                    'full_name' => $fullName !== '' ? $fullName : 'Unknown Patient',
                    'registration_date' => $patient->created_at->format('M d, Y'),
                    'status' => $patient->patient_status,
                ];
            });

        // Staff Performance (Top Doctors by Completed Visits)
        $staffPerformance = DoctorProfile::with(['user', 'specialty'])

            // INFO: count how many visits each doctor has completed
            ->withCount(['visits' => function ($query) {
                $query->where('visit_status', VisitStatus::COMPLETED);
            }])
            ->orderBy('visits_count', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($doctor) {
                $firstName = $doctor->user?->first_name ?? '';
                $lastName = $doctor->user?->last_name ?? '';
                $doctorName = trim("{$firstName} {$lastName}");

                return [
                    'name' => $doctorName !== '' ? "Dr. {$doctorName}" : 'Unassigned Doctor',
                    'department' => $doctor->specialty?->specialty_name ?? 'General',
                    'patients_handled' => $doctor->visits_count,
                ];
            });

        return [
            'totalPatients' => $totalPatients,
            'patientChangePercent' => $patientChangePercent,
            'activeCasesCount' => $activeCases,
            'newCasesToday' => $newCasesToday,
            'todayAppointmentsCount' => $todayAppointments,
            'completedVisitsCount' => $completedVisits,
            'completionRate' => $completionRate,
            'appointmentsTrend' => $appointmentsTrend,
            'caseCategories' => $caseCategories,
            'recentPatients' => $recentPatients,
            'staffPerformance' => $staffPerformance,
        ];
    }

    public function getDoctorStats($user): array
    {
        $today = Carbon::today();
        $doctorId = $user->doctorProfile?->id;

        if (!$doctorId) {
            return [
                'todayAppointmentsCount' => 0,
                'completedVisitsCount' => 0,
                'activeCasesCount' => 0,
                'myPatientsCount' => 0,
                'appointmentsTrend' => [],
                'statusBreakdown' => [],
                'upcomingAppointments' => [],
                'recentVisits' => [],
            ];
        }

        $todayAppointmentsCount = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $today)
            ->count();

        $completedVisitsCount = Visit::where('doctor_id', $doctorId)
            ->where('visit_status', VisitStatus::COMPLETED->value)
            ->count();

        $activeCasesCount = PatientCase::where('case_status', CaseStatus::ACTIVE)
            ->whereHas('appointments', function ($query) use ($doctorId) {
                $query->where('doctor_id', $doctorId);
            })
            ->distinct('id')
            ->count('id');

        $myPatientsCount = Appointment::where('doctor_id', $doctorId)
            ->distinct('patient_id')
            ->count('patient_id');

        $appointmentsTrend = Appointment::select(
            DB::raw('DATE(appointment_date) as date'),
            DB::raw('count(*) as count')
        )
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', '>=', Carbon::now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $statusBreakdown = Appointment::select('status', DB::raw('count(*) as count'))
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', '>=', Carbon::now()->subDays(30))
            ->groupBy('status')
            ->orderByDesc('count')
            ->get();

        $upcomingAppointments = Appointment::with([
            'patient:id,first_name,last_name',
            'patientCase:id,case_number',
        ])
            ->where('doctor_id', $doctorId)
            ->whereDate('appointment_date', '>=', $today)
            ->whereNotIn('status', [
                AppointmentStatus::CANCELLED->value,
                AppointmentStatus::NO_SHOW->value,
                AppointmentStatus::COMPLETED->value,
            ])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(5)
            ->get()
            ->map(function (Appointment $appointment) {
                $firstName = $appointment->patient?->first_name ?? '';
                $lastName = $appointment->patient?->last_name ?? '';

                return [
                    'id' => $appointment->id,
                    'appointment_number' => $appointment->appointment_number,
                    'appointment_date' => optional($appointment->appointment_date)->toDateString(),
                    'appointment_time' => $appointment->appointment_time,
                    'status' => $appointment->status?->value ?? null,
                    'patient_name' => trim("{$firstName} {$lastName}") ?: 'Unknown Patient',
                    'case_number' => $appointment->patientCase?->case_number,
                ];
            })
            ->values();

        $recentVisits = Visit::with([
            'patient:id,first_name,last_name',
            'diagnoses:id,diagnoses_name',
        ])
            ->where('doctor_id', $doctorId)
            ->orderBy('visit_date', 'desc')
            ->orderBy('visit_time', 'desc')
            ->limit(5)
            ->get()
            ->map(function (Visit $visit) {
                $firstName = $visit->patient?->first_name ?? '';
                $lastName = $visit->patient?->last_name ?? '';

                return [
                    'id' => $visit->id,
                    'visit_number' => $visit->visit_number,
                    'visit_date' => optional($visit->visit_date)->toDateString(),
                    'visit_status' => $visit->visit_status?->value ?? null,
                    'patient_name' => trim("{$firstName} {$lastName}") ?: 'Unknown Patient',
                    'diagnoses_name' => $visit->diagnoses?->diagnoses_name,
                ];
            })
            ->values();

        return [
            'todayAppointmentsCount' => $todayAppointmentsCount,
            'completedVisitsCount' => $completedVisitsCount,
            'activeCasesCount' => $activeCasesCount,
            'myPatientsCount' => $myPatientsCount,
            'appointmentsTrend' => $appointmentsTrend,
            'statusBreakdown' => $statusBreakdown,
            'upcomingAppointments' => $upcomingAppointments,
            'recentVisits' => $recentVisits,
        ];
    }

    public function getFdoStats(User $user): array
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();

        $todayAppointmentsCount = Appointment::whereDate('appointment_date', $today)->count();

        $upcomingAppointmentsCount = Appointment::whereDate('appointment_date', '>=', $today)
            ->whereNotIn('status', [
                AppointmentStatus::CANCELLED->value,
                AppointmentStatus::NO_SHOW->value,
                AppointmentStatus::COMPLETED->value,
            ])
            ->count();

        $checkedInAppointmentsCount = Appointment::whereDate('appointment_date', $today)
            ->whereIn('status', [
                AppointmentStatus::CHECKED_IN->value,
                AppointmentStatus::IN_PROGRESS->value,
            ])
            ->count();

        $completedVisitsTodayCount = Visit::whereDate('visit_date', $today)
            ->where('visit_status', VisitStatus::COMPLETED->value)
            ->count();

        $activeCasesCount = PatientCase::where('case_status', CaseStatus::ACTIVE->value)->count();

        $newPatientsThisWeek = Patient::where('created_at', '>=', $startOfWeek)->count();

        $appointmentsTrend = Appointment::select(
            DB::raw('DATE(appointment_date) as date'),
            DB::raw('count(*) as count')
        )
            ->where('appointment_date', '>=', Carbon::now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $statusBreakdown = Appointment::select('status', DB::raw('count(*) as count'))
            ->whereDate('appointment_date', $today)
            ->groupBy('status')
            ->orderByDesc('count')
            ->get();

        $upcomingAppointments = Appointment::with([
            'patient:id,first_name,last_name',
            'patientCase:id,case_number',
            'doctor.user:id,first_name,last_name',
        ])
            ->whereDate('appointment_date', '>=', $today)
            ->whereNotIn('status', [
                AppointmentStatus::CANCELLED->value,
                AppointmentStatus::NO_SHOW->value,
                AppointmentStatus::COMPLETED->value,
            ])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(8)
            ->get()
            ->map(function (Appointment $appointment) {
                $patientFirstName = $appointment->patient?->first_name ?? '';
                $patientLastName = $appointment->patient?->last_name ?? '';

                $doctorFirstName = $appointment->doctor?->user?->first_name ?? '';
                $doctorLastName = $appointment->doctor?->user?->last_name ?? '';
                $doctorName = trim("{$doctorFirstName} {$doctorLastName}");

                return [
                    'id' => $appointment->id,
                    'appointment_number' => $appointment->appointment_number,
                    'appointment_date' => optional($appointment->appointment_date)->toDateString(),
                    'appointment_time' => $appointment->appointment_time,
                    'status' => $appointment->status?->value ?? null,
                    'patient_name' => trim("{$patientFirstName} {$patientLastName}") ?: 'Unknown Patient',
                    'doctor_name' => $doctorName !== '' ? "Dr. {$doctorName}" : null,
                    'case_number' => $appointment->patientCase?->case_number,
                ];
            })
            ->values();

        $recentVisits = Visit::with([
            'patient:id,first_name,last_name',
            'doctor.user:id,first_name,last_name',
            'diagnoses:id,diagnoses_name',
        ])
            ->orderBy('visit_date', 'desc')
            ->orderBy('visit_time', 'desc')
            ->limit(8)
            ->get()
            ->map(function (Visit $visit) {
                $patientFirstName = $visit->patient?->first_name ?? '';
                $patientLastName = $visit->patient?->last_name ?? '';

                $doctorFirstName = $visit->doctor?->user?->first_name ?? '';
                $doctorLastName = $visit->doctor?->user?->last_name ?? '';
                $doctorName = trim("{$doctorFirstName} {$doctorLastName}");

                return [
                    'id' => $visit->id,
                    'visit_number' => $visit->visit_number,
                    'visit_date' => optional($visit->visit_date)->toDateString(),
                    'visit_status' => $visit->visit_status?->value ?? null,
                    'patient_name' => trim("{$patientFirstName} {$patientLastName}") ?: 'Unknown Patient',
                    'doctor_name' => $doctorName !== '' ? "Dr. {$doctorName}" : null,
                    'diagnoses_name' => $visit->diagnoses?->diagnoses_name,
                ];
            })
            ->values();

        return [
            'fdoName' => trim("{$user->first_name} {$user->last_name}"),
            'todayAppointmentsCount' => $todayAppointmentsCount,
            'upcomingAppointmentsCount' => $upcomingAppointmentsCount,
            'checkedInAppointmentsCount' => $checkedInAppointmentsCount,
            'completedVisitsTodayCount' => $completedVisitsTodayCount,
            'activeCasesCount' => $activeCasesCount,
            'newPatientsThisWeek' => $newPatientsThisWeek,
            'appointmentsTrend' => $appointmentsTrend,
            'statusBreakdown' => $statusBreakdown,
            'upcomingAppointments' => $upcomingAppointments,
            'recentVisits' => $recentVisits,
        ];
    }
}
