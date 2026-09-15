<?php

namespace App\Services;

use App\Models\Insurance;
use App\Models\InsuranceAddress;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InsuranceService
{
    public function getAll(Request $request): LengthAwarePaginator
    {
        $query = Insurance::with('primaryAddress');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('insurance_name', 'LIKE', '%' . $search . '%')
                    ->orWhere('insurance_code', 'LIKE', '%' . $search . '%');
            });
        }

        // INFO: Use has() instead of filled() for booleans so that '0' (false) is not ignored.
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->orderBy('insurance_name', 'asc')
            ->paginate($request->get('per_page', 15));
    }

    public function getById(Insurance $insurance): Insurance
    {
        //INFO: Load the primary address and insurance addresses -> lazy loading
        return $insurance->load(['primaryAddress', 'insuranceAddress']);
    }

    public function create(array $data): Insurance
    {
        return DB::transaction(function () use ($data) {
            $addresses = $this->extractAddressesForCreate($data);
            unset($data['addresses'], $data['address'], $data['phone']);

            //INFO: by default it is true
            if (!array_key_exists('is_active', $data)) {
                $data['is_active'] = true;
            }

            $insurance = Insurance::create($data);

            $this->syncInsuranceAddresses($insurance, $addresses);

            return $insurance->load(['primaryAddress', 'insuranceAddress']);
        });
    }

    public function update(Insurance $insurance, array $data): Insurance
    {
        return DB::transaction(function () use ($insurance, $data) {
            $hasAddresses = array_key_exists('addresses', $data) && is_array($data['addresses']);
            $incomingAddresses = $hasAddresses ? $data['addresses'] : [];
            $hasAddress = array_key_exists('address', $data);
            $hasPhone = array_key_exists('phone', $data);

            $address = $data['address'] ?? null;
            $phone = $data['phone'] ?? null;

            unset($data['addresses'], $data['address'], $data['phone']);

            if (!empty($data)) {
                $insurance->update($data);
            }

            if ($hasAddresses) {
                $this->syncInsuranceAddresses($insurance, $this->normalizeAddresses($incomingAddresses));
            } elseif ($hasAddress || $hasPhone) {
                $primaryAddress = $insurance->primaryAddress()->first();

                if ($primaryAddress) {
                    $primaryPayload = [];

                    if ($hasAddress) {
                        $primaryPayload['address'] = $address;
                    }

                    if ($hasPhone) {
                        $primaryPayload['phone'] = $phone;
                    }

                    if (!empty($primaryPayload)) {
                        $primaryAddress->update($primaryPayload);
                    }
                } elseif ($hasAddress && $address) {
                    InsuranceAddress::create([
                        'insurance_id' => $insurance->id,
                        'address' => trim((string) $address),
                        'phone' => $this->normalizePhone($phone),
                        'is_primary' => true,
                    ]);
                }
            }

            return $insurance->load(['primaryAddress', 'insuranceAddress']);
        });
    }

    public function delete(Insurance $insurance): void
    {
        $insurance->delete();
    }

    private function extractAddressesForCreate(array $data): array
    {
        //INFO: 1. addresses exists  2. addresses is array (Not string)
        if (array_key_exists('addresses', $data) && is_array($data['addresses'])) {
            return $this->normalizeAddresses($data['addresses']);
        }

        return [[
            'address' => trim((string) ($data['address'] ?? '')),
            'phone' => $this->normalizePhone($data['phone'] ?? null),
            'is_primary' => true,
        ]];
    }

    private function normalizeAddresses(array $addresses): array
    {
        return collect($addresses)
            ->map(function ($address) {
                return [
                    'id' => $address['id'] ?? null,
                    'address' => trim((string) ($address['address'] ?? '')),
                    'phone' => $this->normalizePhone($address['phone'] ?? null),
                    'is_primary' => $this->toBoolean($address['is_primary'] ?? false),
                ];
            })
            ->values()
            ->all();
    }

    //INFO: create,update,delete insurance addresses

    private function syncInsuranceAddresses(Insurance $insurance, array $addresses): void
    {
        $existing = $insurance->insuranceAddress()->get()->keyBy('id');
        //INFO: contains only the IDs of the addresses the user wants to keep or update.
        $incomingIds = collect($addresses)->pluck('id')->filter()->values();

        $this->validateIncomingIds($existing, $incomingIds);
        $this->deleteRemovedAddresses($insurance, $incomingIds);

        $resolvedAddresses = [];

        foreach ($addresses as $addressData) {
            $record = (!empty($addressData['id']) && $existing->has($addressData['id']))
                ? $this->updateAddress($existing->get($addressData['id']), $addressData)
                : $this->createAddress($insurance, $addressData);

            $resolvedAddresses[] = [
                'id' => $record->id,
                'is_primary' => $addressData['is_primary'],
            ];
        }

        $this->setPrimaryAddress($insurance, $resolvedAddresses);
    }

    private function validateIncomingIds($existing, $incomingIds): void
    {
        if ($incomingIds->isNotEmpty()) {
            $invalidIds = $incomingIds->reject(fn($id) => $existing->has($id));

            if ($invalidIds->isNotEmpty()) {
                throw new \RuntimeException('Invalid insurance address id provided.', 422);
            }
        }
    }

    private function deleteRemovedAddresses(Insurance $insurance, $incomingIds): void
    {
        $insurance->insuranceAddress()
            ->whereNotIn('id', $incomingIds->all())
            ->delete();
    }

    private function updateAddress(InsuranceAddress $record, array $data): InsuranceAddress
    {
        $record->update([
            'address' => $data['address'],
            'phone' => $data['phone'],
            'is_primary' => null,
        ]);

        return $record;
    }

    private function createAddress(Insurance $insurance, array $data): InsuranceAddress
    {
        return InsuranceAddress::create([
            'insurance_id' => $insurance->id,
            'address' => $data['address'],
            'phone' => $data['phone'],
            'is_primary' => null,
        ]);
    }

    private function setPrimaryAddress(Insurance $insurance, array $resolvedAddresses): void
    {
        $primary = collect($resolvedAddresses)->first(fn($address) => $address['is_primary']);

        $insurance->insuranceAddress()->update(['is_primary' => null]);

        if ($primary) {
            $insurance->insuranceAddress()
                ->where('id', $primary['id'])
                ->update(['is_primary' => 1]);
        }
    }

    private function normalizePhone(mixed $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $value = trim((string) $phone);

        return $value !== '' ? $value : null;
    }

    private function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        if (is_string($value)) {
            $normalized = strtolower($value);
            return in_array($normalized, ['1', 'true'], true);
        }

        return false;
    }
}
