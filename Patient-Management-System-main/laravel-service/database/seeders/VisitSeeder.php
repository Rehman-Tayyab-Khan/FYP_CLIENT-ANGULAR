<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Visit;
use App\Models\Appointment;
use App\Models\Diagnoses;
use App\Enums\VisitStatus;
use Carbon\Carbon;

class VisitSeeder extends Seeder
{
    public function run(): void
    {
        $year = now()->format('Y');
        $diagnoses = Diagnoses::all();
        $statuses = VisitStatus::cases();

        foreach (Appointment::all() as $index => $appointment) {
            $status = $statuses[array_rand($statuses)];
            $visitDate = Carbon::parse($appointment->appointment_date);
            $visitTime = Carbon::parse($appointment->appointment_time);
            
            $completedAt = null;
            if ($status === VisitStatus::COMPLETED || $status === VisitStatus::BILLED) {
                $completedAt = $visitDate->copy()->setTime(
                    $visitTime->hour, 
                    $visitTime->minute
                )->addMinutes(rand(15, 60));
            }

            Visit::create([
                'visit_number'           => 'VST-' . $year . '-' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'appointment_id'         => $appointment->id,
                'case_id'                => $appointment->case_id,
                'patient_id'             => $appointment->patient_id,
                'doctor_id'              => $appointment->doctor_id,
                'visit_date'             => $appointment->appointment_date,
                'visit_time'             => $appointment->appointment_time,
                'visit_duration_minutes' => rand(15, 60),
                'diagnoses_id'           => $diagnoses->isNotEmpty() ? $diagnoses->random()->id : null,
                'treatment'              => 'Patient received standard care protocol for ' . ($diagnoses->isNotEmpty() ? strtolower($diagnoses->random()->code) : 'observed symptoms') . '.',
                'treatment_plan'         => '1. Rest for 3 days. 2. Increase fluid intake. 3. Return if symptoms persist.',
                'prescription'           => $this->getSamplePrescription(),
                'prescription_documents' => [
                    ['name' => 'RX-' . rand(1000, 9999) . '.pdf', 'url' => '/storage/prescriptions/sample.pdf']
                ],
                'notes'                  => 'Patient cooperated well during the physical examination. No immediate concerns beyond initial complaint.',
                'vital_signs'            => [
                    'blood_pressure' => rand(110, 140) . '/' . rand(70, 90),
                    'heart_rate'     => rand(60, 100) . ' bpm',
                    'temperature'    => (rand(365, 380) / 10) . ' °C',
                    'weight'         => rand(60, 100) . ' kg',
                ],
                'symptoms'               => 'Mild headache, fatigue, and slight muscle soreness.',
                'follow_up_required'     => rand(0, 1) === 1,
                'follow_up_date'         => Carbon::parse($appointment->appointment_date)->addWeeks(rand(1, 4))->format('Y-m-d'),
                'referral_made'          => rand(1, 10) === 1, // 10% chance
                'referral_to'            => rand(1, 10) === 1 ? 'Specialist ' . fake()->lastName() : null,
                'visit_status'           => $status->value,
                'completed_at'           => $completedAt ? $completedAt->format('Y-m-d H:i:s') : null,
            ]);
        }
    }

    private function getSamplePrescription(): string
    {
        $meds = ['Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg', 'Vitamin C 500mg'];
        $selected = array_rand($meds, 2);
        return $meds[$selected[0]] . " - 1 tablet twice daily\n" . $meds[$selected[1]] . " - 1 tablet at bedtime";
    }
}