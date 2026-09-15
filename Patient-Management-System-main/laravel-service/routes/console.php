<?php

use App\Models\InsuranceAddress;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('insurances:cleanup-seeded-addresses {--dry-run : Preview how many records would be updated}', function () {
    $query = InsuranceAddress::query()->where('address', 'like', 'Main Address %');
    $count = $query->count();

    if ($count === 0) {
        $this->info('No seeded placeholder addresses were found.');

        return 0;
    }

    if ($this->option('dry-run')) {
        $this->info("Dry run: {$count} insurance address record(s) would be updated.");

        return 0;
    }

    $faker = FakerFactory::create();
    $updated = 0;

    $query->each(function (InsuranceAddress $address) use ($faker, &$updated): void {
        $address->update([
            'address' => sprintf(
                '%s, %s, %s %s',
                $faker->streetAddress(),
                $faker->city(),
                $faker->stateAbbr(),
                $faker->postcode()
            ),
        ]);

        $updated++;
    });

    $this->info("Updated {$updated} insurance address record(s).");
})->purpose('Replace seeded Main Address placeholders with realistic addresses');
