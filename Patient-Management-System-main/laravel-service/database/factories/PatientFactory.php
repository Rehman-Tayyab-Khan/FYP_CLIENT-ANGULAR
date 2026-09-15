<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Enums\Gender;
use App\Enums\PatientStatus;

class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'first_name'               => $this->faker->firstName(),
            'middle_name'              => $this->faker->optional()->firstName(),
            'last_name'                => $this->faker->lastName(),
            'date_of_birth'            => $this->faker->date(),
            'gender'                   => $this->faker->randomElement(array_column(Gender::cases(), 'value')),
            'email'                    => $this->faker->unique()->safeEmail(),
            'phone'                    => $this->faker->numerify('03#########'),
            'mobile'                   => $this->faker->numerify('03#########'),
            'address'                  => $this->faker->streetAddress(),
            'city'                     => $this->faker->city(),
            'state'                    => $this->faker->state(),
            'zip_code'                 => $this->faker->postcode(),
            'country'                  => $this->faker->country(),
            'emergency_contact_name'   => $this->faker->name(),
            'emergency_contact_phone'  => $this->faker->numerify('03#########'),
            'primary_physician'        => $this->faker->name(),
            'insurance_provider'       => $this->faker->company(),
            'insurance_policy_number'  => $this->faker->numerify('POLICY-#####'),

            'preferred_language' => $this->faker->randomElement([
                'English', 'Urdu', 'Arabic', 'French', 'Spanish', 'Punjabi', 'Sindhi',
            ]),

            'patient_status'    => $this->faker->randomElement(array_column(PatientStatus::cases(), 'value')),
            'registration_date' => $this->faker->dateTime(),

            'cnic' => $this->faker->unique()->numerify('#####-#######-#'),
        ];
    }
}