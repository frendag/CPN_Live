<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

require_get();

try {
    $pdo = get_pdo();

    $candidates = [
        [
            'table' => 'athletes',
            'id' => 'id',
            'label_sql' => "TRIM(CONCAT(COALESCE(prenom, ''), ' ', COALESCE(nom, '')))"
        ],
        [
            'table' => 'athletes',
            'id' => 'id',
            'label_sql' => 'COALESCE(nom, name)'
        ],
        [
            'table' => 'nageurs',
            'id' => 'id',
            'label_sql' => "TRIM(CONCAT(COALESCE(prenom, ''), ' ', COALESCE(nom, '')))"
        ],
    ];

    foreach ($candidates as $candidate) {
        $tableStmt = $pdo->prepare('SHOW TABLES LIKE :table_name');
        $tableStmt->execute(['table_name' => $candidate['table']]);
        if (!$tableStmt->fetchColumn()) {
            continue;
        }

        $sql = sprintf(
            'SELECT %s AS id, %s AS label FROM %s ORDER BY label ASC',
            $candidate['id'],
            $candidate['label_sql'],
            $candidate['table']
        );

        try {
            $rows = $pdo->query($sql)->fetchAll();
            $athletes = array_values(array_filter(array_map(static function (array $row): ?array {
                $id = isset($row['id']) ? (int) $row['id'] : 0;
                $label = trim((string)($row['label'] ?? ''));
                if ($id <= 0 || $label === '') {
                    return null;
                }
                return ['id' => $id, 'label' => $label];
            }, $rows)));

            json_response(['athletes' => $athletes]);
        } catch (Throwable $ignored) {
            // Tente le prochain mapping.
        }
    }

    json_response(['error' => 'Impossible de déterminer la table athlètes côté backend.'], 500);
} catch (Throwable $e) {
    json_response([
        'error' => 'Erreur serveur lors du chargement des athlètes.',
        'details' => $e->getMessage(),
    ], 500);
}
