<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/database.php';

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        json_response(['error' => 'Corps JSON vide.'], 400);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_response(['error' => 'JSON invalide.'], 400);
    }

    return $decoded;
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['error' => 'Méthode non autorisée.'], 405);
    }
}

function require_get(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        json_response(['error' => 'Méthode non autorisée.'], 405);
    }
}

function validate_performed_at(string $value): bool
{
    $dt = DateTime::createFromFormat('Y-m-d H:i:s', $value);
    return $dt instanceof DateTime && $dt->format('Y-m-d H:i:s') === $value;
}
