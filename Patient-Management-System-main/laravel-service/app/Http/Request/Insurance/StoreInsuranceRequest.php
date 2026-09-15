<?php

namespace App\Http\Request\Insurance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreInsuranceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'insurance_name' => ['required', 'string', 'max:255', 'unique:insurances,insurance_name'],
            'insurance_code' => ['required', 'string', 'max:50', 'unique:insurances,insurance_code'],
            'is_active' => ['sometimes', 'boolean'],
            // Legacy single-address payload is mapped to this array in prepareForValidation().
            'addresses' => ['required', 'array', 'min:1'],
            'addresses.*.address' => ['required', 'string', 'max:500'],
            'addresses.*.phone' => ['required', 'string', 'size:11'],
            'addresses.*.is_primary' => ['required', 'boolean'],
            'address' => ['sometimes', 'string', 'max:500'],
            'phone' => ['required', 'string', 'size:11'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('addresses')) {
            return;
        }

        if (!$this->has('address') && !$this->has('phone')) {
            return;
        }

        $this->merge([
            'addresses' => [[
                'address' => $this->input('address'),
                'phone' => $this->input('phone'),
                'is_primary' => true,
            ]],
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $addresses = $this->input('addresses', []);

            if (!is_array($addresses) || count($addresses) === 0) {
                return;
            }

            $primaryCount = collect($addresses)
                ->filter(fn($address) => filter_var(
                    data_get($address, 'is_primary'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ) === true)
                ->count();

            if ($primaryCount !== 1) {
                $validator->errors()->add('addresses', 'Exactly one address must be marked as primary.');
            }
        });
    }
}
