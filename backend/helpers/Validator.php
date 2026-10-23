<?php

class Validator
{
    private array $errors = [];

    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $ruleSet) {
            $rulesList = is_array($ruleSet) ? $ruleSet : explode('|', $ruleSet);
            $value = $data[$field] ?? null;

            foreach ($rulesList as $rule) {
                if ($rule === 'nullable' && ($value === null || $value === '')) {
                    continue 2;
                }
                if (str_starts_with($rule, 'required') && ($value === null || $value === '')) {
                    $this->errors[$field][] = ucfirst(str_replace('_', ' ', $field)) . ' is required.';
                    continue 2;
                }
                if ($rule === 'email' && $value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[$field][] = 'Invalid email format.';
                }
                if (str_starts_with($rule, 'min:') && $value !== null) {
                    $min = (int) substr($rule, 4);
                    if (is_string($value) && strlen($value) < $min) {
                        $this->errors[$field][] = ucfirst(str_replace('_', ' ', $field)) . " must be at least {$min} characters.";
                    }
                }
                if (str_starts_with($rule, 'max:') && $value !== null) {
                    $max = (int) substr($rule, 4);
                    if (is_string($value) && strlen($value) > $max) {
                        $this->errors[$field][] = ucfirst(str_replace('_', ' ', $field)) . " must not exceed {$max} characters.";
                    }
                }
                if ($rule === 'numeric' && $value !== null && !is_numeric($value)) {
                    $this->errors[$field][] = ucfirst(str_replace('_', ' ', $field)) . ' must be numeric.';
                }
                if (str_starts_with($rule, 'in:') && $value !== null) {
                    $allowed = explode(',', substr($rule, 3));
                    if (!in_array($value, $allowed, true)) {
                        $this->errors[$field][] = 'Invalid value for ' . str_replace('_', ' ', $field) . '.';
                    }
                }
            }
        }

        return empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }
}
