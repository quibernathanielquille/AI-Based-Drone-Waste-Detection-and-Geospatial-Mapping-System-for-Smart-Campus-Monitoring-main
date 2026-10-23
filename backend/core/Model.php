<?php

class Model
{
    protected PDO $db;
    protected string $table = '';
    protected bool $softDeletes = true;

    public function __construct()
    {
        $config = require __DIR__ . '/../config/database.php';
        $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
        $this->db = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    }

    public function find(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id";
        if ($this->softDeletes) {
            $sql .= ' AND deleted_at IS NULL';
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function all(string $orderBy = 'id DESC'): array
    {
        $sql = "SELECT * FROM {$this->table}";
        if ($this->softDeletes) {
            $sql .= ' WHERE deleted_at IS NULL';
        }
        $sql .= " ORDER BY {$orderBy}";
        return $this->db->query($sql)->fetchAll();
    }

    public function create(array $data): int
    {
        $fields = array_keys($data);
        $columns = implode(', ', $fields);
        $placeholders = implode(', ', array_map(fn($f) => ":$f", $fields));
        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $sets = implode(', ', array_map(fn($f) => "$f = :$f", array_keys($data)));
        $sql = "UPDATE {$this->table} SET {$sets} WHERE id = :id";
        if ($this->softDeletes) {
            $sql .= ' AND deleted_at IS NULL';
        }
        $data['id'] = $id;
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }

    public function delete(int $id): bool
    {
        if ($this->softDeletes) {
            $sql = "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = :id AND deleted_at IS NULL";
        } else {
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
        }
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    protected function query(string $sql, array $params = []): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    protected function queryOne(string $sql, array $params = []): ?array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ?: null;
    }
}
