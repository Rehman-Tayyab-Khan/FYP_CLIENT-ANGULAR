<?php

namespace App\Services;

use App\Models\Diagnoses;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class DiagnosesService
{
    public function getAll(Request $request): LengthAwarePaginator
    {
        $query = Diagnoses::query();

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('icd_code', 'LIKE', '%' . $search . '%')
                    ->orWhere('diagnoses_name', 'LIKE', '%' . $search . '%')
                    ->orWhere('description', 'LIKE', '%' . $search . '%');
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query
            ->orderBy('icd_code', 'asc')
            ->paginate($request->get('per_page', 50));
    }
}
