<?php
namespace Database\Factories;

use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\PracticeLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

class DoctorProfileFactory extends Factory
{
    protected $model = DoctorProfile::class;

    public function definition(): array
    {
        return [
            'specialty_id' => Specialty::inRandomOrder()->first()?->id ?? Specialty::factory(),
            'practice_location_id' => PracticeLocation::inRandomOrder()->first()?->id ?? PracticeLocation::factory(),
            'license_number' => 'LIC-' . fake()->unique()->numerify('#####'),
            'availability_schedule' => [
                'monday' => ['09:00-17:00'],
                'tuesday' => ['09:00-17:00'],
                'wednesday' => ['09:00-17:00'],
                'thursday' => ['09:00-17:00'],
                'friday' => ['09:00-17:00']
            ],
        ];
    }
}
