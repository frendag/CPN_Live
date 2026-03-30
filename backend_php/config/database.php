<?php

declare(strict_types=1);

function get_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('CPN_DB_HOST') ?: 'localhost';
    $port = getenv('CPN_DB_PORT') ?: '3306';
    $name = getenv('CPN_DB_NAME') ?: 'cpn_analytics';
    $user = getenv('CPN_DB_USER') ?: 'root';
    $pass = getenv('CPN_DB_PASS') ?: '';
    $charset = getenv('CPN_DB_CHARSET') ?: 'utf8mb4';

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
