<?php

namespace App\Http\Request\Insurance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateInsuranceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $insurance = $this->route('insurance');

        return [
            'insurance_name' => [
                'sometimes',
                'string',
                'max:255',
                'unique:insurances,insurance_name,' . ($insurance ? $insurance->id : '')
            ],
            'insurance_code' => [
                'sometimes',
                'string',
                'max:50',
                'unique:insurances,insurance_code,' . ($insurance ? $insurance->id : '')
            ],
            'is_active' => ['sometimes', 'boolean'],
            'addresses' => ['sometimes', 'array', 'min:1'],
            'addresses.*.id' => [
                'sometimes',
                'uuid',
                Rule::exists('insurance_addresses', 'id')->where(function ($query) use ($insurance) {
                    if ($insurance) {
                        $query->where('insurance_id', $insurance->id);
                    }
                }),
            ],
            'addresses.*.address' => ['required_with:addresses', 'string', 'max:500'],
            'addresses.*.phone' => ['required_with:addresses', 'string', 'size:11'],
            'addresses.*.is_primary' => ['required_with:addresses', 'boolean'],
            'address' => ['sometimes', 'string', 'max:500'],
            'phone' => ['sometimes', 'required_with:address', 'string', 'size:11'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (!$this->has('addresses')) {
                return;
            }

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
