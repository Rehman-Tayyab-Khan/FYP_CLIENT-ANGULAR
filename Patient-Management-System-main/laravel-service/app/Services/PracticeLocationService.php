<?php

namespace App\Services;

use App\Models\PracticeLocation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class PracticeLocationService
{
    public function getAll(Request $request): LengthAwarePaginator
    {
        $query = PracticeLocation::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('location_name', 'LIKE', '%' . $search . '%')
                  ->orWhere('city', 'LIKE', '%' . $search . '%');
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->orderBy('location_name', 'asc')
            ->paginate($request->get('per_page', 15));
    }

    public function getById(PracticeLocation $practiceLocation): PracticeLocation
    {
        return $practiceLocation;
    }

    public function create(array $data): PracticeLocation
    {
        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        return PracticeLocation::create($data);
    }

    public function update(PracticeLocation $practiceLocation, array $data): PracticeLocation
    {
        $practiceLocation->update($data);
        return $practiceLocation;
    }

    public function delete(PracticeLocation $practiceLocation): void
    {
        $practiceLocation->delete();
    }
}
