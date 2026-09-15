<?php

namespace App\Http\Request\PracticeLocation;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePracticeLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $practiceLocation = $this->route('practiceLocation');
        
        return [
            'location_name' => [
                'sometimes',
                'string',
                'max:255',
                'unique:practice_locations,location_name,' . ($practiceLocation ? $practiceLocation->id : '')
            ],
            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:100'],
            'state' => ['sometimes', 'string', 'max:100'],
            'zip' => ['sometimes', 'string', 'max:20'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'email' => ['sometimes', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
