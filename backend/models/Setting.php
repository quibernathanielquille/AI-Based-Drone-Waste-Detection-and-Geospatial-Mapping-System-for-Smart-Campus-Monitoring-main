<?php

class Setting extends Model
{
    protected string $table = 'settings';
    protected bool $softDeletes = false;

    public function getByUser(?int $userId, ?string $group = null): array
    {
        $params = [];
        $where = '(user_id IS NULL OR user_id = :user_id)';
        $params['user_id'] = $userId;

        if ($group) {
            $where .= ' AND setting_group = :group';
            $params['group'] = $group;
        }

        $rows = $this->query(
            "SELECT * FROM settings WHERE {$where} ORDER BY setting_group, setting_key",
            $params
        );

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        return $settings;
    }

    public function upsert(?int $userId, string $key, ?string $value, string $group = 'system'): void
    {
        $existing = $this->queryOne(
            'SELECT id FROM settings WHERE setting_key = :key AND (user_id = :uid OR (user_id IS NULL AND :uid IS NULL))',
            ['key' => $key, 'uid' => $userId]
        );

        if ($existing) {
            $this->update((int) $existing['id'], ['setting_value' => $value]);
        } else {
            $this->create([
                'user_id' => $userId,
                'setting_key' => $key,
                'setting_value' => $value,
                'setting_group' => $group,
            ]);
        }
    }
}
