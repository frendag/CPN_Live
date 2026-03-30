<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';

require_post();

$payload = read_json_body();

$allowedStrokes = [
    'NL' => [10, 25, 50, 100, 200, 400, 800, 1500],
    'BRASSE' => [10, 25, 50, 100, 200],
    'PAPILLON' => [10, 25, 50, 100, 200],
    'DOS' => [10, 25, 50, 100, 200],
    '4N' => [100, 200, 400],
];
$allowedPools = [25, 50];
$allowedStarts = ['PLOT', 'EAU'];

$athleteId = isset($payload['athlete_id']) ? (int) $payload['athlete_id'] : 0;
$strokeCode = strtoupper(trim((string)($payload['stroke_code'] ?? '')));
$distanceM = isset($payload['distance_m']) ? (int) $payload['distance_m'] : 0;
$poolLengthM = isset($payload['pool_length_m']) ? (int) $payload['pool_length_m'] : 0;
$startMode = strtoupper(trim((string)($payload['start_mode'] ?? '')));
$finalTimeMs = isset($payload['final_time_ms']) ? (int) $payload['final_time_ms'] : -1;
$performedAt = trim((string)($payload['performed_at'] ?? ''));
$splits = $payload['splits'] ?? [];

if ($athleteId <= 0) {
    json_response(['error' => 'athlete_id invalide.'], 422);
}
if (!isset($allowedStrokes[$strokeCode])) {
    json_response(['error' => 'stroke_code invalide.'], 422);
}
if (!in_array($distanceM, $allowedStrokes[$strokeCode], true)) {
    json_response(['error' => 'distance_m invalide pour cette nage.'], 422);
}
if (!in_array($poolLengthM, $allowedPools, true)) {
    json_response(['error' => 'pool_length_m invalide.'], 422);
}
if (!in_array($startMode, $allowedStarts, true)) {
    json_response(['error' => 'start_mode invalide.'], 422);
}
if ($finalTimeMs < 0) {
    json_response(['error' => 'final_time_ms invalide.'], 422);
}
if (!validate_performed_at($performedAt)) {
    json_response(['error' => 'performed_at doit être au format YYYY-MM-DD HH:MM:SS.'], 422);
}
if (!is_array($splits)) {
    json_response(['error' => 'splits doit être un tableau.'], 422);
}

$expectedDistances = [];
if ($distanceM > $poolLengthM) {
    for ($cursor = $poolLengthM; $cursor < $distanceM; $cursor += $poolLengthM) {
        $expectedDistances[] = $cursor;
    }
}

$normalizedSplits = [];
foreach ($splits as $index => $split) {
    if (!is_array($split)) {
        json_response(['error' => 'Un split est invalide.'], 422);
    }
    $distance = isset($split['distance_m']) ? (int) $split['distance_m'] : 0;
    $timeMs = isset($split['time_ms']) ? (int) $split['time_ms'] : -1;
    $orderIndex = isset($split['order_index']) ? (int) $split['order_index'] : $index + 1;

    if ($timeMs < 0) {
        json_response(['error' => 'time_ms invalide dans les splits.'], 422);
    }
    if ($orderIndex !== ($index + 1)) {
        json_response(['error' => 'order_index invalide dans les splits.'], 422);
    }
    if (!in_array($distance, $expectedDistances, true)) {
        json_response(['error' => 'distance_m invalide dans les splits.'], 422);
    }

    $normalizedSplits[] = [
        'distance_m' => $distance,
        'time_ms' => $timeMs,
        'order_index' => $orderIndex,
    ];
}

$submittedDistances = array_map(static fn(array $row): int => (int) $row['distance_m'], $normalizedSplits);
sort($submittedDistances);
$expectedSubset = $submittedDistances;
sort($expectedSubset);
foreach ($submittedDistances as $distance) {
    if (!in_array($distance, $expectedDistances, true)) {
        json_response(['error' => 'Les distances intermédiaires sont incohérentes.'], 422);
    }
}

try {
    $pdo = get_pdo();

    // Vérifie l'existence de l'athlète si la table athletes existe.
    $tableExistsStmt = $pdo->query("SHOW TABLES LIKE 'athletes'");
    $athleteTableExists = (bool) $tableExistsStmt->fetchColumn();
    if ($athleteTableExists) {
        $athleteStmt = $pdo->prepare('SELECT id FROM athletes WHERE id = :id LIMIT 1');
        $athleteStmt->execute(['id' => $athleteId]);
        if (!$athleteStmt->fetch()) {
            json_response(['error' => 'athlete_id introuvable.'], 404);
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO training_perf (
            athlete_id,
            stroke_code,
            distance_m,
            pool_length_m,
            start_mode,
            final_time_ms,
            split_count,
            splits_json,
            performed_at
        ) VALUES (
            :athlete_id,
            :stroke_code,
            :distance_m,
            :pool_length_m,
            :start_mode,
            :final_time_ms,
            :split_count,
            :splits_json,
            :performed_at
        )'
    );

    $stmt->execute([
        'athlete_id' => $athleteId,
        'stroke_code' => $strokeCode,
        'distance_m' => $distanceM,
        'pool_length_m' => $poolLengthM,
        'start_mode' => $startMode,
        'final_time_ms' => $finalTimeMs,
        'split_count' => count($normalizedSplits),
        'splits_json' => json_encode($normalizedSplits, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'performed_at' => $performedAt,
    ]);

    json_response([
        'success' => true,
        'id' => (int) $pdo->lastInsertId(),
        'message' => 'Performance enregistrée',
    ], 201);
} catch (Throwable $e) {
    json_response([
        'error' => 'Erreur serveur lors de l’enregistrement.',
        'details' => $e->getMessage(),
    ], 500);
}
