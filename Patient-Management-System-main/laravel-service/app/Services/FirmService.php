<?php

namespace App\Services;

use App\Models\Firm;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class FirmService
{
    public function getAll(Request $request): LengthAwarePaginator
    {
        $query = Firm::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('firm_name', 'LIKE', '%' . $search . '%')
                  ->orWhere('contact_person', 'LIKE', '%' . $search . '%')
                  ->orWhere('address', 'LIKE', '%' . $search . '%');
            });
        }

        if ($request->filled('firm_type')) {
            $query->where('firm_type', $request->input('firm_type'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->orderBy('firm_name', 'asc')
            ->paginate($request->get('per_page', 15));
    }

    public function getById(Firm $firm): Firm
    {
        return $firm;
    }

    public function create(array $data): Firm
    {
        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        return Firm::create($data);
    }

    public function update(Firm $firm, array $data): Firm
    {
        $firm->update($data);
        return $firm;
    }

    public function delete(Firm $firm): void
    {
        $firm->delete();
    }
}
