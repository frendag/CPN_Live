# Backend PHP fourni pour le module Training

Ce dossier contient une implémentation PHP/PDO prête à déposer sur un hébergement classique MySQL/MariaDB.

## Arborescence

- `config/database.php` : connexion PDO MySQL via variables d'environnement
- `config/bootstrap.php` : CORS, JSON, helpers communs
- `api/training_perf.php` : route POST d'enregistrement des performances
- `api/athletes.php` : route GET de liste athlètes compatible avec le front Training
- `api/.htaccess` : réécriture `/api/xxx` vers `/api/xxx.php`

## Variables d'environnement attendues

- `CPN_DB_HOST`
- `CPN_DB_PORT`
- `CPN_DB_NAME`
- `CPN_DB_USER`
- `CPN_DB_PASS`
- `CPN_DB_CHARSET` (optionnel, défaut `utf8mb4`)

## Déploiement type

1. Déposer `backend_php/config` et `backend_php/api` sur le serveur.
2. Vérifier que le document root ou le virtual host expose bien le dossier API attendu.
3. Créer la table SQL `training_perf` avec le script `sql/training_perf.sql`.
4. Tester :
   - `GET /api/athletes`
   - `POST /api/training_perf`

## Payload attendu pour `POST /api/training_perf`

```json
{
  "athlete_id": 123,
  "stroke_code": "NL",
  "distance_m": 50,
  "pool_length_m": 25,
  "start_mode": "PLOT",
  "final_time_ms": 32110,
  "splits": [
    { "distance_m": 25, "time_ms": 15820, "order_index": 1 }
  ],
  "performed_at": "2026-03-30 17:45:12"
}
```

## Remarque sur l'existant

L'application mobile pointe déjà vers `https://cpn-analytics.alwaysdata.net`.
Si ton backend actuel est déjà en PHP avec réécriture d'URL, tu peux simplement fusionner ces fichiers dans son arborescence API.
