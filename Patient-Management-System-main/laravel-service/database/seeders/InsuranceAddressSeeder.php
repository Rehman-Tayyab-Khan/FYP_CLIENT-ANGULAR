<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Insurance;
use App\Models\InsuranceAddress;

class InsuranceAddressSeeder extends Seeder
{
    public function run(): void
    {
        $faker = fake();

        foreach (Insurance::all() as $insurance) {
            InsuranceAddress::create([
                'insurance_id' => $insurance->id,
                'address' => sprintf(
                    '%s, %s, %s %s',
                    $faker->streetAddress(),
                    $faker->city(),
                    $faker->stateAbbr(),
                    $faker->postcode()
                ),
                'phone' => $faker->numerify('##########'),
                'is_primary' => true,
            ]);
        }
    }
}
