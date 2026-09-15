<?php

namespace App\Http\Request\Firm;

use App\Enums\FirmType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFirmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $firm = $this->route('firm');

        return [
            'firm_name' => [
                'sometimes',
                'string',
                'max:255',
                'unique:firms,firm_name,' . ($firm ? $firm->id : '')
            ],
            'firm_type' => ['sometimes', Rule::enum(FirmType::class)],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
