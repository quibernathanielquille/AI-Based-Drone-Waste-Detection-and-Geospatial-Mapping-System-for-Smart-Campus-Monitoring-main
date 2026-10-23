<?php

class Role extends Model
{
    protected string $table = 'roles';

    public function getAllActive(): array
    {
        return $this->query("SELECT id, name, slug, description FROM roles WHERE deleted_at IS NULL ORDER BY id");
    }

    public function findBySlug(string $slug): ?array
    {
        return $this->queryOne(
            "SELECT id, name, slug FROM roles WHERE slug = :slug AND deleted_at IS NULL",
            ['slug' => $slug]
        );
    }
}
